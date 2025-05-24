import { getAllProperties } from "./propertyData";
import { generatePropertiesFromQuery } from "./openrouterService";

class RAGService {
  constructor() {
    this.properties = getAllProperties();
    this.embeddings = new Map(); // Simple keyword-based search for now
    this.initializeSearch();
  }

  initializeSearch() {
    // Create search index
    this.properties.forEach((property) => {
      const searchText = [
        property.name,
        property.location,
        property.type,
        property.description,
        ...property.features,
      ]
        .join(" ")
        .toLowerCase();

      this.embeddings.set(property.id, {
        property,
        searchText,
        keywords: this.extractKeywords(searchText),
      });
    });
  }

  extractKeywords(text) {
    return text
      .split(/\W+/)
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());
  }

  async searchProperties(query) {
    const queryLower = query.toLowerCase();
    const queryKeywords = this.extractKeywords(queryLower);
    let results = [];

    // Location-based search
    if (this.containsLocation(queryLower)) {
      const locationResults = this.searchByLocation(queryLower);
      results.push(...locationResults);
    }

    // Price-based search
    if (this.containsPriceQuery(queryLower)) {
      const priceResults = this.searchByPrice(queryLower);
      results.push(...priceResults);
    }

    // Type-based search
    if (this.containsTypeQuery(queryLower)) {
      const typeResults = this.searchByType(queryLower);
      results.push(...typeResults);
    }

    // General keyword search
    if (results.length === 0) {
      const keywordResults = this.searchByKeywords(queryKeywords);
      results.push(...keywordResults);
    }

    // Remove duplicates and limit results
    const uniqueResults = [...new Map(results.map((r) => [r.id, r])).values()];

    if (uniqueResults.length === 0) {
      // Use openrouter.ai to generate properties
      const generatedResults = await generatePropertiesFromQuery(query);
      return generatedResults.slice(0, 5);
    }

    return uniqueResults.slice(0, 5);
  }

  containsLocation(query) {
    const locations = [
      "mayfair",
      "kensington",
      "chelsea",
      "belgravia",
      "shoreditch",
      "canary wharf",
      "notting hill",
      "hampstead",
      "greenwich",
      "islington",
      "battersea",
      "clapham",
      "wimbledon",
      "richmond",
      "camden",
    ];
    return locations.some((location) => query.includes(location));
  }

  containsPriceQuery(query) {
    const priceKeywords = [
      "expensive",
      "cheap",
      "luxury",
      "budget",
      "premium",
      "affordable",
      "high-end",
      "million",
      "price",
      "cost",
    ];
    return priceKeywords.some((keyword) => query.includes(keyword));
  }

  containsTypeQuery(query) {
    const types = [
      "penthouse",
      "apartment",
      "house",
      "townhouse",
      "mansion",
      "loft",
      "studio",
      "duplex",
      "mews",
      "villa",
    ];
    return types.some((type) => query.includes(type));
  }

  searchByLocation(query) {
    return this.properties.filter((property) => {
      const locationMatch = property.location
        .toLowerCase()
        .includes(this.extractLocationFromQuery(query));
      return locationMatch;
    });
  }

  searchByPrice(query) {
    if (
      query.includes("expensive") ||
      query.includes("luxury") ||
      query.includes("premium")
    ) {
      return this.properties.filter((property) => {
        const price = this.extractPriceValue(property.price);
        return price > 5000000; // Over £5M
      });
    }

    if (
      query.includes("cheap") ||
      query.includes("affordable") ||
      query.includes("budget")
    ) {
      return this.properties.filter((property) => {
        const price = this.extractPriceValue(property.price);
        return price < 2000000; // Under £2M
      });
    }

    return [];
  }

  searchByType(query) {
    const types = [
      "penthouse",
      "apartment",
      "house",
      "townhouse",
      "mansion",
      "loft",
      "studio",
      "duplex",
      "mews",
      "villa",
    ];

    const matchedType = types.find((type) => query.includes(type));
    if (matchedType) {
      return this.properties.filter(
        (property) => property.type.toLowerCase() === matchedType
      );
    }

    return [];
  }

  searchByKeywords(keywords) {
    const scoredResults = [];

    this.embeddings.forEach(({ property, keywords: propKeywords }) => {
      let score = 0;

      keywords.forEach((keyword) => {
        if (propKeywords.includes(keyword)) {
          score += 1;
        }
      });

      if (score > 0) {
        scoredResults.push({ ...property, score });
      }
    });

    return scoredResults.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  extractLocationFromQuery(query) {
    const locations = [
      "mayfair",
      "kensington",
      "chelsea",
      "belgravia",
      "shoreditch",
      "canary wharf",
      "notting hill",
      "hampstead",
      "greenwich",
      "islington",
      "battersea",
      "clapham",
      "wimbledon",
      "richmond",
      "camden",
    ];

    return locations.find((location) => query.includes(location)) || "";
  }

  extractPriceValue(priceString) {
    return parseInt(priceString.replace(/[£,]/g, "")) || 0;
  }

  generateResponse(query, searchResults) {
    if (searchResults.length === 0) {
      return `I have access to ${this.properties.length} luxury properties across London. You can ask me about specific areas like Mayfair, Kensington, or Belgravia, or search by property type like penthouse, townhouse, or apartment. What would you like to know?`;
    }

    const mainResult = searchResults[0];
    const location = this.extractLocationFromQuery(query.toLowerCase());

    let response = "";

    // Add location context
    if (location) {
      response += this.getLocationDescription(location) + " ";
    }

    // Main property information
    response += `Here's a featured property: ${mainResult.name} in ${mainResult.location} for ${mainResult.price}. `;
    response += `This ${mainResult.type.toLowerCase()} offers ${
      mainResult.bedrooms
    } bedrooms, ${mainResult.bathrooms} bathrooms, and ${
      mainResult.area
    } of living space. `;

    if (searchResults.length > 1) {
      response += `I found ${searchResults.length} matching properties in total. `;
    }

    return response;
  }

  getLocationDescription(location) {
    const descriptions = {
      mayfair:
        "Mayfair is a lively and luxurious part of London, known for its high-end shopping, fine dining, and exclusive residential properties.",
      kensington:
        "Kensington is renowned for its cultural attractions including the Victoria and Albert Museum, Natural History Museum, and Kensington Palace.",
      chelsea:
        "Chelsea is an upscale area known for the King's Road and Chelsea FC, offering sophisticated urban living.",
      belgravia:
        "Belgravia is one of London's most exclusive residential areas, characterized by grand white stucco terraces and garden squares.",
      shoreditch:
        "Shoreditch is East London's creative hub, known for its vibrant street art, eclectic nightlife, and innovative restaurants.",
      "canary wharf":
        "Canary Wharf is London's financial district, featuring some of the city's tallest buildings and excellent transport links.",
      "notting hill":
        "Notting Hill is a colorful area famous for Portobello Road Market and the annual carnival.",
      hampstead:
        "Hampstead is a leafy North London village with heath and literary connections.",
      greenwich:
        "Greenwich is a historic area with maritime heritage and beautiful parks.",
      islington:
        "Islington is a trendy North London borough with excellent restaurants and cultural venues.",
    };

    return descriptions[location] || "";
  }

  getRandomProperty() {
    const randomIndex = Math.floor(Math.random() * this.properties.length);
    return this.properties[randomIndex];
  }

  getAllProperties() {
    return this.properties;
  }
}

export default new RAGService();
