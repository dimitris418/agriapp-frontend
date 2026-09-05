// Union types αντί για TypeScript enums: το API στέλνει και δέχεται σκέτα
// strings, οπότε δεν χρειάζεται μετατροπή σε κανένα σημείο.

export type ActivityType = 'SPRAYING' | 'FERTILIZATION' | 'IRRIGATION' | 'OBSERVATION' | 'HARVEST';

export type UnitOfMeasure = 'LITRE' | 'MILLILITRE' | 'KILOGRAM' | 'GRAM' | 'CUBIC_METER' | 'HOUR';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type CropSeason = 'WINTER' | 'SPRING';

export type PestType = 'INSECT' | 'FUNGAL_DISEASE' | 'WEED' | 'OTHER';

export type ProductCategory = 'HERBICIDE' | 'FUNGICIDE' | 'INSECTICIDE' | 'FERTILIZER';
