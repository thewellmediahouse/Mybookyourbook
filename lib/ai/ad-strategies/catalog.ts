export type AdStrategy = {
  id: string;
  label: string;
  focus: string;
  avoid: string;
};

export const legalStrategy: AdStrategy = {
  id: "legal",
  label: "Legal",
  focus:
    "Credibility, professionalism, authority, confidence, and a tasteful office environment.",
  avoid: "Guarantees, exaggerated claims, and cartoonish courtroom drama.",
};

export const realEstateStrategy: AdStrategy = {
  id: "real-estate",
  label: "Real Estate",
  focus: "The agent, lifestyle, movement, the property, and aspirational visual storytelling.",
  avoid: "Fake sold prices or invented neighbourhood claims.",
};

export const restaurantStrategy: AdStrategy = {
  id: "restaurant",
  label: "Restaurant",
  focus: "Appetite, hospitality, atmosphere, and the feeling of being looked after.",
  avoid: "Invented reviews, fake awards, or health claims.",
};

export const hospitalityStrategy: AdStrategy = {
  id: "hospitality",
  label: "Hospitality",
  focus: "Arrival, environment, luxury details, sensory experience, and lifestyle.",
  avoid: "Invented star ratings or availability promises.",
};

export const constructionStrategy: AdStrategy = {
  id: "construction",
  label: "Construction",
  focus: "Craft, reliability, finished work, and trust on site.",
  avoid: "Guaranteed timelines or safety claims we cannot stand behind.",
};

export const financialServicesStrategy: AdStrategy = {
  id: "financial-services",
  label: "Financial services",
  focus: "Trust, clarity, credibility, and professional communication.",
  avoid: "Fabricated financial performance, returns, or regulated advice.",
};

export const automotiveStrategy: AdStrategy = {
  id: "automotive",
  label: "Automotive",
  focus: "The vehicle, the expert, movement, and a confident handover.",
  avoid: "Invented specs, finance rates, or performance figures.",
};

export const medicalStrategy: AdStrategy = {
  id: "medical",
  label: "Medical",
  focus: "Care, calm authority, and a respectful clinical environment.",
  avoid: "Guaranteed outcomes, scare tactics, or invented medical claims.",
};

export const homeServicesStrategy: AdStrategy = {
  id: "home-services",
  label: "Home services",
  focus: "Problem → expert → solution → relief → call to action.",
  avoid: "Guaranteed quotes or invented before-and-after results.",
};

export const ecommerceStrategy: AdStrategy = {
  id: "ecommerce",
  label: "Ecommerce",
  focus: "The product in use, a clear offer, and an easy next step.",
  avoid: "Fake scarcity, invented reviews, or hidden terms.",
};

export const retailStrategy: AdStrategy = {
  id: "retail",
  label: "Retail",
  focus: "The shop, the product, friendly help, and walking in.",
  avoid: "Invented discounts or stock claims.",
};

export const softwareStrategy: AdStrategy = {
  id: "software",
  label: "Software",
  focus: "A real problem, a clear product benefit, and a simple next step.",
  avoid: "Invented user counts, uptime, or competitor attacks.",
};

export const generalStrategy: AdStrategy = {
  id: "general",
  label: "General",
  focus: "A recognisable presenter, a clear problem, a practical benefit, and a direct call to action.",
  avoid: "Exaggeration, invented proof, or anything the brief asked us not to say.",
};

export const AD_STRATEGIES = [
  legalStrategy,
  realEstateStrategy,
  restaurantStrategy,
  hospitalityStrategy,
  constructionStrategy,
  financialServicesStrategy,
  automotiveStrategy,
  medicalStrategy,
  homeServicesStrategy,
  ecommerceStrategy,
  retailStrategy,
  softwareStrategy,
  generalStrategy,
] as const;

export function resolveAdStrategy(industry: string | null | undefined): AdStrategy {
  const value = (industry ?? "").trim().toLowerCase();
  if (!value) {
    return generalStrategy;
  }
  if (/(legal|lawyer|law\b|attorney)/.test(value)) {
    return legalStrategy;
  }
  if (/(real estate|propert|estate agent)/.test(value)) {
    return realEstateStrategy;
  }
  if (/(restaurant|cafe|dining|food)/.test(value)) {
    return restaurantStrategy;
  }
  if (/(hotel|hospitality|guest house|lodge)/.test(value)) {
    return hospitalityStrategy;
  }
  if (/(construct|builder|renovat)/.test(value)) {
    return constructionStrategy;
  }
  if (/(financ|bank|insur|account)/.test(value)) {
    return financialServicesStrategy;
  }
  if (/(auto|car dealer|vehicle|motor)/.test(value)) {
    return automotiveStrategy;
  }
  if (/(medical|clinic|dental|health|doctor)/.test(value)) {
    return medicalStrategy;
  }
  if (/(plumb|electr|hvac|garden|clean|home service)/.test(value)) {
    return homeServicesStrategy;
  }
  if (/(ecommerce|e-commerce|online shop)/.test(value)) {
    return ecommerceStrategy;
  }
  if (/(retail|shop|store|boutique)/.test(value)) {
    return retailStrategy;
  }
  if (/(software|saas|app\b|tech)/.test(value)) {
    return softwareStrategy;
  }
  return generalStrategy;
}
