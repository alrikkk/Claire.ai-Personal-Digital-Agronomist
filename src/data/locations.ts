export interface AgriculturalLocation {
  name: string;
  region: string;
  country: string;
  climateZone: string;
  majorCrops: string[];
}

export const REAL_AGRICULTURAL_LOCATIONS: AgriculturalLocation[] = [
  { name: 'Nairobi', region: 'Central Highlands', country: 'Kenya', climateZone: 'Subtropical Highland', majorCrops: ['Coffee', 'Tea', 'Maize', 'Horticulture'] },
  { name: 'Nakuru', region: 'Rift Valley', country: 'Kenya', climateZone: 'Temperate Highland', majorCrops: ['Wheat', 'Maize', 'Barley', 'Pyrethrum'] },
  { name: 'Eldoret', region: 'Uasin Gishu', country: 'Kenya', climateZone: 'Cool Highland', majorCrops: ['Wheat', 'Maize', 'Canola', 'Dairy'] },
  { name: 'Mombasa', region: 'Coastal Lowlands', country: 'Kenya', climateZone: 'Tropical Wet/Dry', majorCrops: ['Cassava', 'Cashew', 'Coconut', 'Mangoes'] },
  { name: 'Kisumu', region: 'Lake Victoria Basin', country: 'Kenya', climateZone: 'Tropical Wet', majorCrops: ['Sugarcane', 'Rice', 'Cotton', 'Sorghum'] },
  { name: 'Salinas Valley', region: 'California', country: 'United States', climateZone: 'Mediterranean Semi-Arid', majorCrops: ['Lettuce', 'Strawberries', 'Broccoli', 'Spinach'] },
  { name: 'Fresno', region: 'San Joaquin Valley, CA', country: 'United States', climateZone: 'Mediterranean Irrigated', majorCrops: ['Almonds', 'Grapes', 'Pistachios', 'Tomatoes'] },
  { name: 'Ames', region: 'Iowa Corn Belt', country: 'United States', climateZone: 'Humid Continental', majorCrops: ['Corn', 'Soybeans', 'Alfalfa', 'Swine'] },
  { name: 'Champaign', region: 'Illinois Prairie', country: 'United States', climateZone: 'Humid Continental', majorCrops: ['Corn', 'Soybeans', 'Winter Wheat'] },
  { name: 'Yakima Valley', region: 'Washington', country: 'United States', climateZone: 'Semi-Arid Basin', majorCrops: ['Apples', 'Hops', 'Sweet Cherries', 'Grapes'] },
  { name: 'Lubbock', region: 'High Plains, Texas', country: 'United States', climateZone: 'Semi-Arid High Plains', majorCrops: ['Cotton', 'Sorghum', 'Peanuts', 'Wheat'] },
  { name: 'Punjab (Ludhiana)', region: 'Indo-Gangetic Plain', country: 'India', climateZone: 'Subtropical Semi-Arid', majorCrops: ['Wheat', 'Rice (Basmati)', 'Cotton', 'Sugarcane'] },
  { name: 'Maharashtra (Nashik)', region: 'Western Ghats', country: 'India', climateZone: 'Tropical Wet & Dry', majorCrops: ['Grapes', 'Onions', 'Pomegranates', 'Sugarcane'] },
  { name: 'Andhra Pradesh (Guntur)', region: 'Eastern Ghats', country: 'India', climateZone: 'Tropical Savanna', majorCrops: ['Chili Peppers', 'Cotton', 'Tobacco', 'Paddy'] },
  { name: 'Ribeirão Preto', region: 'São Paulo', country: 'Brazil', climateZone: 'Tropical Savanna (Cwa)', majorCrops: ['Sugarcane', 'Citrus / Oranges', 'Coffee', 'Soybeans'] },
  { name: 'Mato Grosso (Sorriso)', region: 'Cerrado', country: 'Brazil', climateZone: 'Tropical Savanna', majorCrops: ['Soybeans', 'Corn (Safrinha)', 'Cotton', 'Pasture'] },
  { name: 'Perth (Wheatbelt)', region: 'Western Australia', country: 'Australia', climateZone: 'Mediterranean Dry-Summer', majorCrops: ['Wheat', 'Barley', 'Canola', 'Lupins'] },
  { name: 'Darling Downs (Toowoomba)', region: 'Queensland', country: 'Australia', climateZone: 'Humid Subtropical', majorCrops: ['Sorghum', 'Cotton', 'Chickpeas', 'Barley'] },
  { name: 'Beauce (Chartres)', region: 'Centre-Val de Loire', country: 'France', climateZone: 'Oceanic Temperate', majorCrops: ['Soft Wheat', 'Sugar Beet', 'Barley', 'Rapeseed'] },
  { name: 'Almería', region: 'Andalusia', country: 'Spain', climateZone: 'Hot Semi-Arid (Greenhouse)', majorCrops: ['Greenhouse Tomatoes', 'Peppers', 'Cucumbers', 'Zucchini'] },
  { name: 'Po Valley (Bologna)', region: 'Emilia-Romagna', country: 'Italy', climateZone: 'Humid Subtropical', majorCrops: ['Durum Wheat', 'Tomatoes', 'Wine Grapes', 'Fruit Orchards'] },
  { name: 'Niigata', region: 'Chūbu', country: 'Japan', climateZone: 'Humid Subtropical Snow Belt', majorCrops: ['Koshihikari Rice', 'Tulips', 'Edamame', 'Watermelon'] },
  { name: 'Free State (Bloemfontein)', region: 'Highveld', country: 'South Africa', climateZone: 'Semi-Arid Highveld', majorCrops: ['Maize', 'Sunflower', 'Sorghum', 'Wheat'] },
  { name: 'Pampas (Rosario)', region: 'Santa Fe', country: 'Argentina', climateZone: 'Humid Subtropical', majorCrops: ['Soybeans', 'Corn', 'Wheat', 'Sunflower'] },
  { name: 'Saskatchewan (Regina)', region: 'Canadian Prairies', country: 'Canada', climateZone: 'Humid Continental Dry', majorCrops: ['Canola', 'Durum Wheat', 'Lentils', 'Peas'] },
  { name: 'Guangdong (Zhanjiang)', region: 'Pearl River Delta', country: 'China', climateZone: 'Humid Subtropical', majorCrops: ['Sugarcane', 'Pineapples', 'Bananas', 'Paddy Rice'] },
  { name: 'Heilongjiang (Harbin)', region: 'Northeast Black Soil Belt', country: 'China', climateZone: 'Humid Continental / Monsoon', majorCrops: ['Soybeans', 'Corn', 'Japonica Rice', 'Sugar Beet'] }
];
