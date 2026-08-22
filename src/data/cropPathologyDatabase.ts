export interface CropPathologyRecord {
  crop: string;
  disease: string;
  scientificName: string;
  pathogenType: 'Fungal' | 'Bacterial' | 'Viral' | 'Pest' | 'Nutritional' | 'Oomycete' | 'Nematode' | 'Physiological';
  severity: 'High' | 'Medium' | 'Low';
  symptoms: string[];
  organicRemediation: string[];
  chemicalControl: string[];
  preventativePractice: string[];
  keywords: string[];
}

export const CROP_PATHOLOGY_KNOWLEDGE_BASE: CropPathologyRecord[] = [
  // Tomato
  {
    crop: 'Tomato',
    disease: 'Early Blight',
    scientificName: 'Alternaria solani',
    pathogenType: 'Fungal',
    severity: 'Medium',
    symptoms: [
      'Concentric dark brown rings (target-board appearance) on older lower foliage',
      'Progressive yellowing (chlorosis) around necrotic spots followed by leaf drop',
      'Dark sunken leathery stem and collar cankers near the soil line'
    ],
    organicRemediation: [
      'Spray copper octanoate or Bacillus subtilis bio-fungicide weekly',
      'Apply potassium bicarbonate solution (1 tbsp/gal water + mild soap) to shift leaf surface pH',
      'Heavy straw or organic mulching to block soil-splashing fungal spores'
    ],
    chemicalControl: [
      'Apply preventative Chlorothalonil or Mancozeb at first sign of target spots',
      'Use systemic strobilurin fungicides (Azoxystrobin, Pyraclostrobin) for active canopy containment'
    ],
    preventativePractice: [
      'Practice a minimum 3-year crop rotation avoiding nightshades (potatoes, peppers, eggplants)',
      'Prune lower 30cm of foliage to eliminate ground contact and maximize air circulation',
      'Strictly use drip irrigation in morning hours to prevent leaf wetness'
    ],
    keywords: ['tomato', 'early blight', 'alternaria solani', 'target spot', 'concentric rings', 'yellow leaves', 'leaf drop']
  },
  {
    crop: 'Tomato',
    disease: 'Late Blight',
    scientificName: 'Phytophthora infestans',
    pathogenType: 'Oomycete',
    severity: 'High',
    symptoms: [
      'Large irregular water-soaked pale-to-dark olive lesions that turn purplish-brown',
      'Fluffy white fungal-like mildew on the underside of leaves during cool, damp mornings',
      'Rapid stem browning, total canopy collapse, and greasy brown fruit rot'
    ],
    organicRemediation: [
      'Immediate copper hydroxide sprays upon local regional blight alerts',
      'Immediate destruction and disposal of severely infected plants (do not compost)'
    ],
    chemicalControl: [
      'Metalaxyl / Mefenoxam or Cymoxanil tank-mixed with protectant Mancozeb',
      'Mandipropamid or Fluopicolide for systemic oomycete protection'
    ],
    preventativePractice: [
      'Ensure wide plant spacing (60cm x 90cm) for fast morning leaf drying',
      'Eradicate volunteer tomato/potato weed hosts near field perimeters',
      'Choose resistant cultivars (e.g., Defiant Ph-R, Mountain Merit)'
    ],
    keywords: ['tomato', 'late blight', 'phytophthora infestans', 'water soaked', 'white mildew', 'canopy collapse', 'greasy rot']
  },
  {
    crop: 'Tomato',
    disease: 'Bacterial Wilt',
    scientificName: 'Ralstonia solanacearum',
    pathogenType: 'Bacterial',
    severity: 'High',
    symptoms: [
      'Rapid daytime wilting of green foliage while leaves remain green without initial yellowing',
      'Vascular discoloration (browning of internal stem xylem)',
      'Milky bacterial stream emerges when cut stem is suspended in clear water'
    ],
    organicRemediation: [
      'Soil solarization with clear polyethylene plastic for 6-8 weeks during peak summer',
      'Incorporate bio-fumigant brassica cover crops (mustard meal) into soil prior to transplant'
    ],
    chemicalControl: [
      'No curative chemical sprays exist for systemic vascular bacteria',
      'Streptomycin / Copper drenching can protect uninfected nursery beds'
    ],
    preventativePractice: [
      'Graft commercial scions onto resistant wild rootstocks (e.g., Maxifort, Shin Cheong Gwang)',
      'Raise soil pH to 6.5-7.0 with agricultural lime; avoid waterlogged heavy clay beds',
      'Disinfect pruning shears and staking posts with 10% bleach solution'
    ],
    keywords: ['tomato', 'bacterial wilt', 'ralstonia', 'wilting green', 'vascular browning', 'bacterial stream', 'soilborne']
  },
  {
    crop: 'Tomato',
    disease: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    scientificName: 'Begomovirus',
    pathogenType: 'Viral',
    severity: 'High',
    symptoms: [
      'Severe upward curling and cupping of leaf margins with yellowing',
      'Severe plant stunting with bushy, upright growth and reduced leaf lamina',
      'Flower drop with little to no fruit development'
    ],
    organicRemediation: [
      'Spray neem oil or insecticidal potassium soaps to suppress whitefly vector populations',
      'Install yellow sticky cards at canopy height (1 trap per 10m²)'
    ],
    chemicalControl: [
      'Target whitefly vectors with Acetamiprid, Imidacloprid, or Spiromesifen',
      'Rotate insecticide IRAC classes to prevent vector chemical resistance'
    ],
    preventativePractice: [
      'Use 50-mesh fine insect-proof exclusion netting in nursery and greenhouse tunnels',
      'Plant TYLCV-resistant hybrids (e.g., Tycoon, Ansal F1, SV0421TD)',
      'Maintain a 2-month host-free crop break between Solanaceous seasons'
    ],
    keywords: ['tomato', 'tylcv', 'leaf curl', 'yellow curl', 'whitefly', 'stunting', 'bushy', 'begomovirus']
  },
  {
    crop: 'Tomato',
    disease: 'Blossom End Rot',
    scientificName: 'Physiological Calcium / Moisture Imbalance',
    pathogenType: 'Physiological',
    severity: 'Medium',
    symptoms: [
      'Water-soaked sunken spot at the blossom end (base) of young green tomatoes',
      'Lesion enlarges, darkens, and turns black, leathery, and flat/concave'
    ],
    organicRemediation: [
      'Foliar spray with chelated calcium or calcium chloride (0.5%) during fruit sizing',
      'Apply crushed agricultural gypsum or dolomitic lime around rootzone'
    ],
    chemicalControl: [
      'Foliar calcium nitrate applications in combination with boron for enhanced transport'
    ],
    preventativePractice: [
      'Maintain consistent, even soil moisture via automated drip irrigation (avoid wet-dry fluctuations)',
      'Avoid excessive ammoniacal nitrogen fertilization which outcompetes Ca²⁺ uptake',
      'Mulch heavily to preserve constant root moisture'
    ],
    keywords: ['tomato', 'blossom end rot', 'calcium deficiency', 'black bottom', 'sunken fruit', 'irregular watering']
  },

  // Rice / Paddy
  {
    crop: 'Rice',
    disease: 'Rice Blast',
    scientificName: 'Magnaporthe oryzae (Pyricularia oryzae)',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Spindle-shaped / diamond lesions with grey or whitish centers and reddish-brown borders on leaves',
      'Black necrosis and rotting at panicle base/neck (neck blast) causing total grain blanking/sterility',
      'Node browning causing lodging and breaking of tillers'
    ],
    organicRemediation: [
      'Apply soluble silicon fertilizers (potassium silicate) to thicken epidermal cell walls',
      'Seed bio-priming with Trichoderma harzianum and Pseudomonas fluorescens cultures'
    ],
    chemicalControl: [
      'Apply Tricyclazole 75% WP (0.6g/L) or Isoprothiolane 40% EC at booting/heading',
      'Azoxystrobin + Difenoconazole combination for simultaneous leaf and neck blast control'
    ],
    preventativePractice: [
      'Avoid excessive nitrogen fertilization; split N into 3-4 balanced doses with potash',
      'Maintain continuous 5cm water level in paddy; avoid drought-stressing the vegetative stage',
      'Plant blast-resistant paddy varieties and treat seed before sowing'
    ],
    keywords: ['rice', 'paddy', 'blast', 'magnaporthe', 'spindle lesions', 'neck blast', 'blank grains', 'collar rot']
  },
  {
    crop: 'Rice',
    disease: 'Bacterial Leaf Blight (BLB)',
    scientificName: 'Xanthomonas oryzae pv. oryzae',
    pathogenType: 'Bacterial',
    severity: 'High',
    symptoms: [
      'Water-soaked to yellowish-white wavy stripes starting from leaf tips and margins',
      'Lesions turn straw-colored and dry out with milky bacterial ooze droplets in morning dew',
      'Kresek phase: wilting and rolling of entire seedling tillers in early stage'
    ],
    organicRemediation: [
      'Foliar spray with fresh cow dung filtrate (20%) mixed with neem oil (traditional antimicrobial)',
      'Apply copper oxychloride (2.5g/L) to suppress surface bacterial population'
    ],
    chemicalControl: [
      'Copper Hydroxide + Streptomycin sulphate (Plantomycin 100ppm) spray',
      'No cure once inside vascular bundle; focus on limiting neighboring field spread'
    ],
    preventativePractice: [
      'Drain excess stagnant floodwaters during typhoon/heavy rain storms',
      'Avoid clipping seedling leaf tips during manual transplanting (creates bacterial entry wounds)',
      'Apply balanced potassium (K₂O) to strengthen leaf tissue'
    ],
    keywords: ['rice', 'paddy', 'bacterial leaf blight', 'blb', 'xanthomonas', 'wavy stripes', 'kresek', 'bacterial ooze']
  },
  {
    crop: 'Rice',
    disease: 'Sheath Blight',
    scientificName: 'Rhizoctonia solani',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Oval or irregular greenish-grey water-soaked spots on leaf sheaths near the waterline',
      'Lesions coalesce with dark brown margins resembling snake skin/band patterns climbing up canopy',
      'Severe lodging and premature senescence of upper tillers'
    ],
    organicRemediation: [
      'Soil application of Trichoderma viride enriched farmyard manure',
      'Spray Pseudomonas fluorescens formulation (10g/L)'
    ],
    chemicalControl: [
      'Spray Hexaconazole 5% EC (2ml/L) or Validamycin 3% L (2.5ml/L)',
      'Azoxystrobin or Trifloxystrobin + Tebuconazole at sheath emergence'
    ],
    preventativePractice: [
      'Optimize hill planting density (20cm x 15cm) to reduce canopy humidity',
      'Remove weed hosts (Echinochloa, Cyperus) along bunds that harbor sclerotia',
      'Deep summer plowing to bury surviving fungal sclerotia'
    ],
    keywords: ['rice', 'sheath blight', 'rhizoctonia', 'snake skin', 'waterline', 'hexaconazole', 'validamycin']
  },
  {
    crop: 'Rice',
    disease: 'Brown Spot',
    scientificName: 'Bipolaris oryzae (Cochliobolus miyabeanus)',
    pathogenType: 'Fungal',
    severity: 'Medium',
    symptoms: [
      'Small, circular to oval sesame-seed-like dark brown spots with yellowish halos across leaves',
      'Discoloration and black spotting on glumes causing reduced grain weight and poor milling quality'
    ],
    organicRemediation: [
      'Hot water seed treatment at 52-54°C for 10-12 minutes prior to nursery sowing',
      'Apply bio-fungicides with zinc and silica micronutrients'
    ],
    chemicalControl: [
      'Spray Mancozeb 75% WP (2g/L) or Propiconazole 25% EC (1ml/L)',
      'Carbendazim + Mancozeb seed treatment'
    ],
    preventativePractice: [
      'Correct soil nutrient deficiencies (especially Potassium, Silicon, and Zinc in poor sandy soils)',
      'Ensure proper water drainage and avoid prolonged drought in seedling nurseries'
    ],
    keywords: ['rice', 'brown spot', 'bipolaris', 'sesame spots', 'zinc deficiency', 'milling loss']
  },

  // Wheat
  {
    crop: 'Wheat',
    disease: 'Yellow / Stripe Rust',
    scientificName: 'Puccinia striiformis f. sp. tritici',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Bright yellow-orange powdery pustules arranged in parallel linear stripes along leaf veins',
      'Leaves dry up, yellow, and display scorched appearance under heavy infection',
      'Shriveled, lightweight, poorly filled grains'
    ],
    organicRemediation: [
      'Spray wettable sulfur (2-3g/L) during early vegetative stages',
      'Intercrop with legumes or non-host mustard strips'
    ],
    chemicalControl: [
      'Propiconazole 25% EC (Tilt @ 1ml/L) or Tebuconazole 250 EC at first appearance of yellow stripes',
      'Azoxystrobin + Cyproconazole for persistent protection across flag leaf emergence'
    ],
    preventativePractice: [
      'Sow certified rust-resistant wheat varieties (e.g., HD-2967, PBW-550, DBW-187, Eldo-Mavuno)',
      'Ensure timely planting before winter temperatures rise into optimal fungal sporulation range (10-15°C with dew)'
    ],
    keywords: ['wheat', 'yellow rust', 'stripe rust', 'puccinia striiformis', 'yellow stripes', 'pustules', 'propiconazole', 'tilt']
  },
  {
    crop: 'Wheat',
    disease: 'Powdery Mildew',
    scientificName: 'Blumeria graminis f. sp. tritici',
    pathogenType: 'Fungal',
    severity: 'Medium',
    symptoms: [
      'White to grey fluffy cotton-like fungal patches on upper leaf surfaces and sheaths',
      'Patches turn dull brownish-grey with tiny black fruiting bodies (cleistothecia)',
      'Chlorosis and premature death of flag leaves'
    ],
    organicRemediation: [
      'Dilute milk spray (10-15% in water) or potassium bicarbonate (3g/L) under full sun',
      'Neem oil formulations (0.5%)'
    ],
    chemicalControl: [
      'Apply Tebuconazole, Propiconazole, or Triadimefon (Bayleton @ 1g/L)',
      'Quinoxyfen or Metrafenone for specialized anti-mildew action'
    ],
    preventativePractice: [
      'Avoid high seeding rates and overly dense canopies',
      'Avoid excessive top-dressing with nitrogen which produces succulent susceptible leaves'
    ],
    keywords: ['wheat', 'powdery mildew', 'blumeria', 'white powder', 'grey patches', 'cottony']
  },
  {
    crop: 'Wheat',
    disease: 'Karnal Bunt',
    scientificName: 'Tilletia indica',
    pathogenType: 'Fungal',
    severity: 'Medium',
    symptoms: [
      'Individual grains converted into black powdery teliospore masses with fishy odor (trimethylamine)',
      'Usually only a portion of the grain is bunted, leaving the outer pericarp intact'
    ],
    organicRemediation: [
      'Seed bio-inoculation with Trichoderma viride',
      'Hot water seed immersion prior to sowing'
    ],
    chemicalControl: [
      'Seed treatment with Carboxin + Thiram (2.5g/kg seed)',
      'Foliar spray with Propiconazole (0.1%) at 50% earhead flowering'
    ],
    preventativePractice: [
      'Avoid excessive irrigation during earhead emergence and anthesis',
      'Use certified bunted-free seed stock'
    ],
    keywords: ['wheat', 'karnal bunt', 'tilletia', 'fishy odor', 'black grain', 'bunt']
  },

  // Corn / Maize
  {
    crop: 'Corn (Maize)',
    disease: 'Fall Armyworm',
    scientificName: 'Spodoptera frugiperda',
    pathogenType: 'Pest',
    severity: 'High',
    symptoms: [
      'Ragged, shredded shot-holes in whorl leaves with abundant sawdust-like moist frass',
      'Caterpillar has inverted Y-shape mark on head and 4 raised dots arranged in square on 8th abdominal segment',
      'Boring into developing cobs, tassels, and ear tips'
    ],
    organicRemediation: [
      'Apply Bacillus thuringiensis (Bt @ 2g/L) or Spinosad into the central whorl',
      'Release Trichogramma parasitic wasps (50,000/acre)',
      'Place fine sand/wood ash mixed with dry chili powder directly into central whorls'
    ],
    chemicalControl: [
      'Emamectin Benzoate 5% SG (0.4g/L) or Chlorantraniliprole 18.5% SC (0.4ml/L)',
      'Spinetoram 11.7% SC directed into the leaf whorl'
    ],
    preventativePractice: [
      'Install pheromone traps (5 per acre) for early moth detection',
      'Intercrop maize with non-host silverleaf desmodium or beans (push-pull strategy)',
      'Synchronous planting across neighboring farm blocks'
    ],
    keywords: ['corn', 'maize', 'fall armyworm', 'spodoptera', 'whorl', 'sawdust frass', 'ragged leaves', 'inverted y']
  },
  {
    crop: 'Corn (Maize)',
    disease: 'Common Rust',
    scientificName: 'Puccinia sorghi',
    pathogenType: 'Fungal',
    severity: 'Medium',
    symptoms: [
      'Cinnamon-brown to golden powdery pustules (uredinia) scattered on both upper and lower leaf surfaces',
      'Pustules turn brownish-black as plant matures (teliospores)',
      'Premature leaf senescence and reduced cob fill'
    ],
    organicRemediation: [
      'Sulfur dust or wettable sulfur (3g/L) early morning',
      'Neem seed kernel extract (NSKE 5%)'
    ],
    chemicalControl: [
      'Azoxystrobin + Pyraclostrobin or Propiconazole 25% EC at early tasseling if disease severity > 10%'
    ],
    preventativePractice: [
      'Plant rust-resistant commercial hybrid maize varieties',
      'Avoid late-season planting when airborne spore loads peak'
    ],
    keywords: ['corn', 'maize', 'common rust', 'puccinia sorghi', 'cinnamon pustules', 'brown dust']
  },
  {
    crop: 'Corn (Maize)',
    disease: 'Northern Corn Leaf Blight (NCLB)',
    scientificName: 'Exserohilum turcicum (Setosphaeria turcica)',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Long, elliptical, cigar-shaped greyish-green to tan lesions (2.5 to 15 cm long) on leaves',
      'Lesions coalesce causing complete foliage burning and rapid cob filling shutdown'
    ],
    organicRemediation: [
      'Foliar spray of Trichoderma harzianum or copper-based protectors',
      'Deep plowing to bury infested crop residue'
    ],
    chemicalControl: [
      'Mancozeb 75% WP (2.5g/L) or Azoxystrobin + Difenoconazole spray at first lesion appearance'
    ],
    preventativePractice: [
      'Crop rotation with legumes (soybean, groundnut, beans) for at least 1-2 seasons',
      'Plant NCLB-tolerant hybrids (e.g., DKC series, Pioneer hybrids)'
    ],
    keywords: ['corn', 'maize', 'northern corn leaf blight', 'nclb', 'cigar shaped', 'exserohilum', 'elliptical lesions']
  },

  // Potato
  {
    crop: 'Potato',
    disease: 'Late Blight',
    scientificName: 'Phytophthora infestans',
    pathogenType: 'Oomycete',
    severity: 'High',
    symptoms: [
      'Irregular water-soaked dark brown spots on leaves with pale green margins',
      'White cottony downy growth on the underside of infected leaves in high relative humidity (>90%)',
      'Tubers show dry, reddish-brown granular rot under the skin that rots completely in storage'
    ],
    organicRemediation: [
      'Prophylactic copper hydroxide or Bordeaux mixture (1%) sprays before rainy cool fronts',
      'Destruction of infected foliage (haulm killing) 2 weeks before tuber harvest'
    ],
    chemicalControl: [
      'Cymoxanil + Mancozeb (Curzate) or Metalaxyl-M + Mancozeb (Ridomil Gold)',
      'Dimethomorph, Fluopicolide, or Cyazofamid for systemic curative knockdown'
    ],
    preventativePractice: [
      'Plant certified disease-free seed tubers only',
      'High earthing up / ridging (15-20cm) to prevent washed zoospores from reaching developing tubers',
      'Never irrigate late afternoon or evening'
    ],
    keywords: ['potato', 'late blight', 'phytophthora', 'water soaked', 'white downy', 'tuber rot', 'ridomil']
  },
  {
    crop: 'Potato',
    disease: 'Black Scurf & Stem Canker',
    scientificName: 'Rhizoctonia solani',
    pathogenType: 'Fungal',
    severity: 'Medium',
    symptoms: [
      'Hard, black, dirt-like irregular crusts (sclerotia) adhering tightly to tuber skin that do not wash off',
      'Sunken brown necrotic cankers on underground sprouts causing delayed emergence and missing hills',
      'Aerial tubers forming in leaf axils due to blocked vascular flow'
    ],
    organicRemediation: [
      'Seed tuber coating with Trichoderma viride (10g/kg)',
      'Crop rotation with cereals and green manuring'
    ],
    chemicalControl: [
      'Seed tuber dip in Pencycuron (Monceren @ 2.5ml/L) or Azoxystrobin furrow drench'
    ],
    preventativePractice: [
      'Plant tubers in warm, well-aerated soils (shallow planting followed by later ridging)',
      'Allow potato skin to mature and cure properly before harvesting'
    ],
    keywords: ['potato', 'black scurf', 'rhizoctonia', 'black crust', 'stem canker', 'aerial tubers', 'sclerotia']
  },

  // Cotton
  {
    crop: 'Cotton',
    disease: 'Cotton Leaf Curl Virus (CLCuV)',
    scientificName: 'Begomovirus',
    pathogenType: 'Viral',
    severity: 'High',
    symptoms: [
      'Upward and downward leaf curling with severe thickening of main and secondary veins',
      'Enation: leaf-like cup-shaped outgrowth on the underside of main leaf veins',
      'Extreme plant stunting, reduction in sympodial fruiting branches, and boll shedding'
    ],
    organicRemediation: [
      'Neem oil (1500ppm @ 5ml/L) + yellow sticky traps (15/acre) to control whitefly vector (Bemisia tabaci)',
      'Eradicate alternate weed hosts (Abutilon indicum, Sida acuta)'
    ],
    chemicalControl: [
      'Pyriproxyfen 10% EC (2ml/L) or Diafenthiuron 50% WP (1.2g/L) for whitefly suppression',
      'Afidopyropen 50g/L DC for novel vector management'
    ],
    preventativePractice: [
      'Grow CLCuD-resistant Bt cotton cultivars',
      'Avoid planting near tobacco, okra, or sunflower fields that harbor high whitefly densities'
    ],
    keywords: ['cotton', 'leaf curl', 'clcuv', 'clcud', 'enation', 'vein thickening', 'whitefly', 'boll shedding']
  },
  {
    crop: 'Cotton',
    disease: 'Bacterial Blight / Angular Leaf Spot',
    scientificName: 'Xanthomonas citri subsp. malvacearum',
    pathogenType: 'Bacterial',
    severity: 'High',
    symptoms: [
      'Small, angular, water-soaked spots bounded by leaf veinlets, turning reddish-brown',
      'Blackarm phase: elongated black cankers on branches and main stem causing breakage',
      'Boll rot with sunken dark brown circular lesions staining lint fiber'
    ],
    organicRemediation: [
      'Seed acid delinting with concentrated sulfuric acid (100ml/kg seed)',
      'Spray Pseudomonas fluorescens or copper oxychloride'
    ],
    chemicalControl: [
      'Copper Oxychloride 50% WP (3g/L) + Streptocycline (1g/10L) foliar spray'
    ],
    preventativePractice: [
      'Use acid-delinted certified seed',
      'Destroy previous crop stubble to eliminate overwintering bacterial inoculum'
    ],
    keywords: ['cotton', 'bacterial blight', 'angular leaf spot', 'blackarm', 'xanthomonas malvacearum', 'boll rot']
  },

  // Soybean
  {
    crop: 'Soybean',
    disease: 'Asian Soybean Rust',
    scientificName: 'Phakopsora pachyrhizi',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Tiny tan to dark brown raised pustules (volcano-shaped uredinia) primarily on underside of lower leaves',
      'Rapid yellowing and early defoliation moving rapidly up the plant',
      'Severely reduced pod set, 2-seeded pods, and shriveled light seeds'
    ],
    organicRemediation: [
      'Prophylactic copper fungicides during early canopy closure',
      'Early harvesting if grain fill is already 85% complete'
    ],
    chemicalControl: [
      'Triazole + Strobilurin tank mixes (e.g., Pyraclostrobin + Fluxapyroxad or Tebuconazole + Azoxystrobin)',
      'Apply at R1 (first flower) to R3 (early pod) stages before rust climbs to upper canopy'
    ],
    preventativePractice: [
      'Plant early-maturing varieties to escape peak regional spore shower periods',
      'Eradicate volunteer kudzu vines and weed legumes in vicinity'
    ],
    keywords: ['soybean', 'asian rust', 'phakopsora', 'volcano pustules', 'defoliation', 'pod loss', 'tebuconazole']
  },

  // Groundnut / Peanut
  {
    crop: 'Groundnut (Peanut)',
    disease: 'Tikka Disease (Early & Late Leaf Spot)',
    scientificName: 'Cercospora arachidicola & Phaeoisariopsis personata',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Early spot: circular brown lesions with bright yellow halo on upper leaf surface',
      'Late spot: smaller, darker carbon-black circular spots without prominent yellow halo',
      'Severe defoliation leaving bare stems and drastic pod yield reduction'
    ],
    organicRemediation: [
      'Spray Neem seed kernel extract (NSKE 5%) or 3% Panchagavya solution',
      'Soil enrichment with Trichoderma harzianum'
    ],
    chemicalControl: [
      'Mancozeb 75% WP (2g/L) or Carbendazim 50% WP (1g/L) or Chlorothalonil 75% WP (2g/L)',
      'Tebuconazole 25.9% EC (1.5ml/L) for curative control'
    ],
    preventativePractice: [
      'Crop rotation with non-host cereals (pearl millet, sorghum, maize)',
      'Treat seed kernels with Thiram + Carbendazim (2g/kg seed) before sowing'
    ],
    keywords: ['groundnut', 'peanut', 'tikka disease', 'cercospora', 'leaf spot', 'yellow halo', 'defoliation']
  },

  // Banana
  {
    crop: 'Banana',
    disease: 'Panama Disease / Fusarium Wilt (TR4)',
    scientificName: 'Fusarium oxysporum f. sp. cubense',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Yellowing of oldest lower leaves starting from leaf margins towards midrib',
      'Buckling/skirting of dying leaves around pseudostem base forming a skirt',
      'Internal vascular discoloration (reddish-brown to black streaks inside pseudostem corm)'
    ],
    organicRemediation: [
      'Drench rootzone with bio-agent Pseudomonas fluorescens (Pf1) + Trichoderma viride',
      'Incorporate large volumes of neem cake (250g/plant) at planting'
    ],
    chemicalControl: [
      'No chemical fungicide can cure systemic vascular Fusarium in soil',
      'Inject 2% Carbendazim into corm of early affected non-productive sucker to slow spread'
    ],
    preventativePractice: [
      'Plant tissue-culture suckers from certified TR4-free laboratories',
      'Strict field quarantine: disinfect boots, machetes, and machinery with 20% Farmclean or quaternary ammonium',
      'Switch to resistant cultivars (e.g., GCTCV-218, Formosana)'
    ],
    keywords: ['banana', 'panama disease', 'fusarium wilt', 'tr4', 'leaf buckling', 'corm discoloration', 'vascular streaks']
  },
  {
    crop: 'Banana',
    disease: 'Sigatoka Leaf Spot (Black & Yellow)',
    scientificName: 'Pseudocercospora fijiensis / musae',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Small reddish-brown streaks parallel to leaf veins that enlarge into elliptical necrotic spots',
      'Spot centers turn grey with dark brown/black border',
      'Extensive leaf area destruction causing premature bunch ripening with unmarketable small fingers'
    ],
    organicRemediation: [
      'De-leafing / manual trimming of infected leaf strips with weekly removal from orchard',
      'Spray mineral oil (Banole @ 5L/ha) emulsion'
    ],
    chemicalControl: [
      'Systemic Triazoles (Propiconazole, Difenoconazole) or Strobilurins mixed in oil-water emulsion',
      'Rotate FRAC groups to counter high risk of fungicide resistance'
    ],
    preventativePractice: [
      'Maintain excellent orchard drainage and optimal stool density (1.8m x 1.8m)',
      'Ensure balanced potassium nutrition to enhance cuticular resistance'
    ],
    keywords: ['banana', 'sigatoka', 'black sigatoka', 'pseudocercospora', 'brown streaks', 'premature ripening', 'de-leafing']
  },

  // Coffee
  {
    crop: 'Coffee',
    disease: 'Coffee Leaf Rust',
    scientificName: 'Hemileia vastatrix',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Bright orange to yellowish-orange powdery spore patches on undersides of leaves',
      'Corresponding chlorotic yellow patches visible on upper leaf surfaces',
      'Severe defoliation leading to dieback of bearing wood and biennial bearing cycle collapse'
    ],
    organicRemediation: [
      'Apply Bordeaux mixture 0.5% (Copper sulfate + quicklime) prior to monsoon rains',
      'Pruning shade trees to allow morning sunshine and wind to dry leaf canopies'
    ],
    chemicalControl: [
      'Cyproconazole, Epoxiconazole, or Pyraclostrobin sprays at 45-day intervals during wet seasons'
    ],
    preventativePractice: [
      'Plant rust-resistant hybrid varieties (e.g., Catimor, Castillo, Ruiru 11, Marsellesa)',
      'Maintain balanced fertilizer programs (avoid high N without adequate K)'
    ],
    keywords: ['coffee', 'leaf rust', 'hemileia vastatrix', 'orange powder', 'pustules', 'bordeaux mixture', 'dieback']
  },

  // Citrus (Lemon, Orange, Lime)
  {
    crop: 'Citrus (Orange, Lemon, Lime)',
    disease: 'Citrus Canker',
    scientificName: 'Xanthomonas citri subsp. citri',
    pathogenType: 'Bacterial',
    severity: 'High',
    symptoms: [
      'Raised, corky, rough brownish-tan lesions on leaves, stems, and fruits',
      'Lesions surrounded by a characteristic oily, water-soaked, yellow chlorotic halo',
      'Crater-like appearance in old lesions causing leaf drop and unmarketable fruit blemishes'
    ],
    organicRemediation: [
      'Prune and incinerate all infected twigs during dormant dry winter period',
      'Spray Copper Oxychloride 50% WP (3g/L) during new shoot flush emergence'
    ],
    chemicalControl: [
      'Streptomycin sulphate 90% + Tetracycline 10% (Plantomycin @ 100ppm) mixed with copper hydroxide'
    ],
    preventativePractice: [
      'Establish windbreak trees (Casuarina, Eucalyptus) around orchard perimeter to reduce wind-driven rain spread',
      'Control citrus leaf miner (Phyllocnistis citrella) whose feeding wounds provide direct bacterial entry points'
    ],
    keywords: ['citrus', 'lemon', 'orange', 'citrus canker', 'xanthomonas', 'corky lesions', 'yellow halo', 'leafminer']
  },
  {
    crop: 'Citrus (Orange, Lemon, Lime)',
    disease: 'Citrus Greening / Huanglongbing (HLB)',
    scientificName: 'Candidatus Liberibacter asiaticus',
    pathogenType: 'Bacterial',
    severity: 'High',
    symptoms: [
      'Asymmetrical blotchy yellow mottle on leaves that crosses leaf veins',
      'Small, lopsided, bitter green fruits with aborted dark seeds that fail to color properly at harvest',
      'Yellow shoots and rapid tree decline / dieback'
    ],
    organicRemediation: [
      'Release Tamarixia radiata parasitoids against Asian citrus psyllid (Diaphorina citri) vectors',
      'Systemic nutritional trunk feeding (zinc, manganese, iron, boron) to prolong tree vitality'
    ],
    chemicalControl: [
      'Strict control of psyllid vectors with Imidacloprid, Thiamethoxam, or Dimethoate',
      'Trunk injection of Oxytetracycline hydrochloride where officially registered'
    ],
    preventativePractice: [
      'Plant only certified disease-free nursery trees propagated in insect-proof screened facilities',
      'Immediate rogueing (eradication) and burning of confirmed HLB-infected trees to protect neighbors'
    ],
    keywords: ['citrus', 'greening', 'huanglongbing', 'hlb', 'blotchy mottle', 'psyllid', 'lopsided fruit', 'bitter fruit']
  },

  // Chili & Pepper
  {
    crop: 'Chili & Pepper',
    disease: 'Anthracnose / Fruit Rot',
    scientificName: 'Colletotrichum capsici / gloeosporioides',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Circular, sunken, water-soaked dark spots on ripe red and green chili fruits',
      'Concentric rings of tiny black fruiting bodies (acervuli) or salmon-pink spore masses in lesion centers',
      'Dieback of shoot tips turning straw-colored from top downwards'
    ],
    organicRemediation: [
      'Seed treatment with Trichoderma viride (10g/kg)',
      'Foliar spray with Pseudomonas fluorescens (10g/L) or neem oil (5ml/L)'
    ],
    chemicalControl: [
      'Azoxystrobin 23% SC (1ml/L) or Tebuconazole + Trifloxystrobin 75% WG (0.6g/L)',
      'Difenoconazole 25% EC or Mancozeb 75% WP'
    ],
    preventativePractice: [
      'Avoid harvesting when fruits are damp with morning dew',
      'Collect and destroy infected mummified fruits from previous seasons'
    ],
    keywords: ['chili', 'pepper', 'anthracnose', 'colletotrichum', 'fruit rot', 'sunken spots', 'concentric rings', 'dieback']
  },
  {
    crop: 'Chili & Pepper',
    disease: 'Chili Leaf Curl Virus',
    scientificName: 'Begomovirus',
    pathogenType: 'Viral',
    severity: 'High',
    symptoms: [
      'Upward curling, puckering, and crinkling of leaves with reduced leaf size',
      'Shortened internodes resulting in severe stunting and bunched bushy habit',
      'Drastic flower drop and deformed small pungent fruits'
    ],
    organicRemediation: [
      'Spray neem seed kernel extract (NSKE 5%) + install yellow sticky traps for whiteflies and blue traps for thrips'
    ],
    chemicalControl: [
      'Diafenthiuron 50% WP (1g/L) or Fipronil 5% SC (2ml/L) or Acetamiprid 20% SP (0.5g/L)'
    ],
    preventativePractice: [
      'Eradicate Solanaceous weeds around nursery and border rows',
      'Raise nursery under 40-mesh nylon insect net'
    ],
    keywords: ['chili', 'pepper', 'leaf curl', 'puckering', 'whitefly', 'thrips', 'stunted', 'bushy']
  },

  // Onion & Garlic
  {
    crop: 'Onion & Garlic',
    disease: 'Purple Blotch',
    scientificName: 'Alternaria porri',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Small, water-soaked sunken lesions on leaves and seed stalks that turn dark purple with reddish-purple borders',
      'Lesions enlarge and girdle the tubular leaf, causing leaves to break over and collapse prematurely',
      'Under moist conditions, brown-to-black velvety sporulation covers lesion surfaces'
    ],
    organicRemediation: [
      'Foliar spray of Trichoderma harzianum with sticker/spreader agent (leaves are waxy)',
      'Spray baking soda solution with horticultural soap'
    ],
    chemicalControl: [
      'Mancozeb 75% WP (2.5g/L) or Iprodione 50% WP (2g/L) or Difenoconazole 25% EC (1ml/L)',
      'Always add non-ionic wetting sticker (e.g., Sandovit @ 0.5ml/L) due to waxy onion foliage'
    ],
    preventativePractice: [
      'Maintain 3-year rotation away from all Allium crops (garlic, shallots, leeks)',
      'Ensure well-drained raised planting beds to avoid standing water'
    ],
    keywords: ['onion', 'garlic', 'purple blotch', 'alternaria porri', 'purple lesions', 'leaf break', 'velvety sporulation']
  },

  // Sugarcane
  {
    crop: 'Sugarcane',
    disease: 'Red Rot',
    scientificName: 'Colletotrichum falcatum',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Third or fourth leaf from top yellows, withers, and dries along the margins',
      'Splitting cane reveals longitudinal reddening of internal pith tissue with distinct white transverse bands',
      'Fermentation / alcoholic sour odor from freshly split diseased cane'
    ],
    organicRemediation: [
      'Hot water sett treatment (50°C for 2 hours) or moist hot air treatment (54°C for 2.5 hours)',
      'Dipping setts in Trichoderma viride culture slurry before planting'
    ],
    chemicalControl: [
      'Sett dip in Carbendazim 50% WP (1g/L) or Thiophanate-methyl 70% WP (1g/L) for 15 minutes before furrow placement'
    ],
    preventativePractice: [
      'Plant certified red rot-resistant sugarcane clones (e.g., Co 0238, Co 86032, CoPk 05)',
      'Avoid ratooning of infected cane fields; immediately burn stubble'
    ],
    keywords: ['sugarcane', 'red rot', 'colletotrichum falcatum', 'red pith', 'white bands', 'sour smell', 'sett dip']
  }
];

/**
 * Searches the pathology knowledge base for matching records based on query tokens.
 */
export function findMatchingCropPathology(query: string): CropPathologyRecord[] {
  if (!query || typeof query !== 'string') return [];
  const clean = query.toLowerCase().trim();
  const tokens = clean.split(/[\s,.;:!?\(\)\/\-]+/).filter(t => t.length > 2);

  if (tokens.length === 0) return [];

  const scored: { item: CropPathologyRecord; score: number }[] = [];

  for (const item of CROP_PATHOLOGY_KNOWLEDGE_BASE) {
    let score = 0;
    const cropLower = item.crop.toLowerCase();
    const diseaseLower = item.disease.toLowerCase();
    const sciLower = item.scientificName.toLowerCase();

    for (const token of tokens) {
      if (cropLower.includes(token)) score += 8;
      if (diseaseLower.includes(token)) score += 10;
      if (sciLower.includes(token)) score += 10;
      if (item.keywords.some(k => k.includes(token))) score += 5;
      if (item.symptoms.some(s => s.toLowerCase().includes(token))) score += 3;
      if (item.organicRemediation.some(o => o.toLowerCase().includes(token))) score += 2;
      if (item.chemicalControl.some(c => c.toLowerCase().includes(token))) score += 2;
      if (item.preventativePractice.some(p => p.toLowerCase().includes(token))) score += 2;
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}

/**
 * Formats a CropPathologyRecord into a clean, accurate agronomic markdown response.
 */
export function formatCropPathologyResponse(record: CropPathologyRecord, userQuestion?: string): string {
  return `### 🌾 Agronomic Pathology Analysis: ${record.crop} — ${record.disease}
*Scientific Name: ${record.scientificName} | Pathogen Type: ${record.pathogenType} | Severity: ${record.severity}*

#### 🔍 Visual Symptoms & Diagnostics:
${record.symptoms.map(s => `- **${s}**`).join('\n')}

#### 🌿 Organic & Low-Cost Biological Remedies:
${record.organicRemediation.map(o => `- ${o}`).join('\n')}

#### 🧪 Targeted Chemical Controls:
${record.chemicalControl.map(c => `- ${c}`).join('\n')}

#### 🛡️ Agronomic Field Best Practices & Prevention:
${record.preventativePractice.map(p => `- ${p}`).join('\n')}

---
💡 *Agronomist Tip: Always inspect both the upper and lower leaf surfaces during morning hours. When mixing foliar solutions, check water pH (target 6.0–6.8) and use a suitable spreader/sticker on waxy crops.*`;
}
