export interface CropFact {
  id: string;
  category: string;
  fact: string;
  source: string;
  iconType: 'grain' | 'leaf' | 'soil' | 'satellite' | 'droplet' | 'sun' | 'dna';
}

export const VERIFIED_CROP_FACTS: CropFact[] = [
  {
    id: 'fact-1',
    category: 'Photosynthesis & Grain Filling',
    fact: 'During the final grain-filling phase, the upper flag leaf of a wheat plant generates up to 75% of the carbohydrates stored directly into the harvestable grain.',
    source: 'FAO Crop Physiology & Agronomy Bulletin',
    iconType: 'grain'
  },
  {
    id: 'fact-2',
    category: 'Soil Organic Carbon',
    fact: 'Every 1% increase in topsoil organic matter enables agricultural soil to retain an extra 20,000 to 27,000 gallons of plant-available water per acre.',
    source: 'USDA Natural Resources Conservation Service (NRCS)',
    iconType: 'soil'
  },
  {
    id: 'fact-3',
    category: 'Microbial Symbiosis',
    fact: 'Mycorrhizal fungal hyphae in healthy soils expand a crop’s functional root absorption zone by over 700%, mobilizing otherwise insoluble phosphorus and zinc.',
    source: 'International Journal of Agronomy',
    iconType: 'leaf'
  },
  {
    id: 'fact-4',
    category: 'Biological Nitrogen Fixation',
    fact: 'Legumes form symbiotic root nodules with Rhizobia bacteria to convert atmospheric dinitrogen into plant-usable ammonium, fixing up to 300 kg of nitrogen per hectare each season.',
    source: 'Plant Physiology & Soil Biology',
    iconType: 'dna'
  },
  {
    id: 'fact-5',
    category: 'Satellite Remote Sensing',
    fact: 'Multispectral sensors capture Solar-Induced Chlorophyll Fluorescence (SIF)—a 1–2% light emission from chloroplasts that reveals moisture stress hours before visible wilting.',
    source: 'European Space Agency & NASA Earth Science',
    iconType: 'satellite'
  },
  {
    id: 'fact-6',
    category: 'Canopy Transpiration',
    fact: 'A single hectare of mature crop can transpire up to 20,000 liters of water daily, producing a localized microclimate cooling effect of 2°C to 4°C above the canopy.',
    source: 'Agronomy Journal & WMO Agro-meteorology',
    iconType: 'droplet'
  },
  {
    id: 'fact-7',
    category: 'Stomatal Dynamics',
    fact: 'Plants regulate gas exchange across millions of microscopic stomatal pores using rapid potassium ion fluxes in guard cells, balancing CO₂ intake against vapor pressure deficits.',
    source: 'Nature Plants & Plant Cell Environment',
    iconType: 'sun'
  },
  {
    id: 'fact-8',
    category: 'Subsurface Root Architecture',
    fact: 'Modern cereal varieties can push taproots and seminal roots past 2.0 meters into the subsoil profile, accessing deep perched water tables during summer grain fill.',
    source: 'Crop Science Society of America',
    iconType: 'soil'
  }
];
