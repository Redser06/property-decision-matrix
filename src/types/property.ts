export type MarketMode = 'IE' | 'UK';

export type PortalSource = 'Daft.ie' | 'MyHome.ie' | 'Rightmove' | 'Zoopla' | 'Knight Frank' | 'Manual';

export type SolarOrientation =
  | 'Due South'
  | 'South-East'
  | 'South-West'
  | 'East-West'
  | 'North-West';

export type StepId = 1 | 2 | 3 | 4;

export interface PropertyCandidate {
  id: string;
  code: string;
  name: string;
  area: string;
  postcode: string;
  sourcePortal: PortalSource;
  sourceUrl: string;
  imageUrl: string;
  askingPrice: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  sqm: number;
  energyRating: string;
  energyScore: number; // 0-100 normalized
  tenure: string;
  requiredWorksCost: number;
  requiredWorksLabel: string;
  heatingUpgradeCost: number;
  heatingUpgradeLabel: string;
  legalSurveyCost: number;
  contingencyCost: number;
  coordinates: {
    lat: number;
    lng: number;
    mapX: number; // 0-100 SVG canvas coord
    mapY: number; // 0-100 SVG canvas coord
  };
  commuteMinutes: number;
  commuteRoute: string;
  secondaryCommuteMinutes: number;
  ambientNoiseDb: number;
  noiseDescription: string;
  walkTitle: string;
  walkSubtitle: string;
  walkBadge: string;
  hiddenAmenities: string[];
  solarOrientation: SolarOrientation;
  winterSunHours: number;
  solarDescription: string;
  catchmentSchool: string;
  catchmentProbability: number;
  catchmentStatus: string;
  catchmentNote: string;
  hasDedicatedWfhNook: boolean;
  hasOffStreetParkingOrEv: boolean;
  gardenLengthFt: number;
  ceilingHeightM: number;
  architecturalNote: string;
  renovationIsCosmeticOnly: boolean;
  thirdBedroomSqft: number;
  parsedHighlights: string[];
}

export interface BudgetConfig {
  targetPurchaseMax: number;
  totalLandedCostCeiling: number;
  renovationBuffer: number;
  emergencyContingency: number;
}

export interface HouseholdProfile {
  clientNames: string;
  portfolioTitle: string;
  portfolioSubtitle: string;
  modelCode: string;
  adults: string;
  adultsTag: string;
  children: string;
  childrenNote: string;
  childrenTag: string;
  pets: string;
  petsTag: string;
  primaryCommuteTarget: string;
  primaryCommuteMaxMins: number;
  secondaryCommuteTarget: string;
  secondaryCommuteFreq: string;
  priorityCatchmentLabel: string;
  priorityCatchmentNote: string;
}

export interface NonNegotiableRule {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  strict: boolean;
}

export interface PriorityWeights {
  budgetBuffer: number; // 1..5
  gardenSolar: number; // 1..5
  acousticQuiet: number; // 1..5
  architecturalChar: number; // 1..5
  microWalkability: number; // 1..5
  energyEfficiency: number; // 1..5
}

export interface CompromisesConfig {
  cosmeticRenovationOk: boolean;
  smallerThirdBedroomOk: boolean;
  longerCommuteForNatureOk: boolean;
}

export interface DecisionWeights {
  headPercent: number; // 0..100
  nonNegotiables: NonNegotiableRule[];
  priorityWeights: PriorityWeights;
  compromises: CompromisesConfig;
}

export interface RuleCheckResult {
  ruleId: string;
  ruleTitle: string;
  status: 'PASS' | 'REVIEW' | 'FAIL';
  strict: boolean;
  evidence: string;
}

export interface EvaluatedProperty {
  property: PropertyCandidate;
  stampDuty: number;
  totalWorksAndUpgrades: number;
  totalLandedCost: number;
  purchaseCeilingDelta: number; // positive = over purchase ceiling
  landedBuffer: number; // positive = under landed cap, negative = overrun
  pricePerSqft: number;
  pricePerSqm: number;
  prudenceScore: number; // 0-100
  lifestyleScore: number; // 0-100
  capitalPreservationScore: number; // 0-100
  compositeScore: number; // 0-100
  ruleChecks: RuleCheckResult[];
  failedStrictRules: RuleCheckResult[];
  isDisqualified: boolean;
  rank: number;
  verdictRole: 'WINNER' | 'RUNNER_UP' | 'DISQUALIFIED';
  verdictTag: string;
  verdictCalloutTitle: string;
  verdictCalloutBody: string;
}

export interface TradeOffDeltaPill {
  label: string;
  sublabel: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface TradeOffComparison {
  targetId: string;
  targetName: string;
  badgeText: string;
  badgeTone: 'winner-vs-runner' | 'winner-vs-disqualified';
  headline: string;
  summary: string;
  pills: TradeOffDeltaPill[];
}

export interface PortfolioEvaluation {
  evaluated: EvaluatedProperty[];
  winner: EvaluatedProperty;
  runnerUp: EvaluatedProperty | null;
  varianceToRunnerUp: number;
  confidenceCoefficient: number;
  eigenvectorConsistency: number;
  sensitivityScore: number;
  comparisons: TradeOffComparison[];
  qualifiedCount: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  actionLabel?: string;
  done: boolean;
}

export interface PortfolioPreset {
  id: MarketMode;
  label: string;
  shortLabel: string;
  currencySymbol: '€' | '£';
  currencyCode: 'EUR' | 'GBP';
  taxLabel: string;
  registryFootnote: string;
  budget: BudgetConfig;
  household: HouseholdProfile;
  weights: DecisionWeights;
  properties: PropertyCandidate[];
  checklist: ChecklistItem[];
}
