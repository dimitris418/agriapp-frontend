import { ActivityType, CropSeason, PestType, ProductCategory, SeverityLevel, UnitOfMeasure } from './enums';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  SPRAYING: 'Ψεκασμός',
  FERTILIZATION: 'Λίπανση',
  IRRIGATION: 'Άρδευση',
  OBSERVATION: 'Παρατήρηση',
  HARVEST: 'Συγκομιδή',
};

export const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  LITRE: 'λίτρα',
  MILLILITRE: 'ml',
  KILOGRAM: 'κιλά',
  GRAM: 'γραμμάρια',
  CUBIC_METER: 'κυβικά μέτρα',
  HOUR: 'ώρες',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  LOW: 'Χαμηλή',
  MEDIUM: 'Μέτρια',
  HIGH: 'Υψηλή',
};

export const CROP_SEASON_LABELS: Record<CropSeason, string> = {
  WINTER: 'Χειμερινό',
  SPRING: 'Εαρινό',
};

export const PEST_TYPE_LABELS: Record<PestType, string> = {
  INSECT: 'Έντομο',
  FUNGAL_DISEASE: 'Μυκητολογική ασθένεια',
  WEED: 'Ζιζάνιο',
  OTHER: 'Άλλο',
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  HERBICIDE: 'Ζιζανιοκτόνο',
  FUNGICIDE: 'Μυκητοκτόνο',
  INSECTICIDE: 'Εντομοκτόνο',
  FERTILIZER: 'Λίπασμα',
};
