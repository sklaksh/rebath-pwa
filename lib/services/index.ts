// Export all services
export { authService } from './auth.service'
export { assessmentService } from './assessment.service'
export { pricingService } from './pricing.service'
export { projectService } from './project.service'
export { roomService } from './room.service'
export { photoService } from './photo.service'
export { quoteService } from './quote.service'
export { fixtureService } from './fixture.service'
export { pdfService } from './pdf.service'
export { jobWorkService } from './job-work.service'
export { fixtureCategoryService } from './fixture-category.service'
export { fixtureOptionService } from './fixture-option.service'

// Export types
export type {
  AuthError,
  SignUpData,
  SignInData
} from './auth.service'

export type {
  FixtureData,
  AssessmentData,
  AssessmentError
} from './assessment.service'

export type {
  SelectedFixture,
  PricingData,
  CalculatorPricingData,
  PricingError
} from './pricing.service'

export type {
  Project,
  ProjectError,
  ProjectStats
} from './project.service'

export type {
  RoomType,
  RoomTypeError
} from './room.service'

export type {
  QuoteData,
  QuoteItem,
  QuoteError
} from './quote.service'

export type {
  FixtureCategory,
  FixtureOption,
  FixtureError
} from './fixture.service'

export type {
  JobWorkItem,
  CreateJobWorkItemData,
  UpdateJobWorkItemData,
  JobWorkError
} from './job-work.service'

export type {
  FixtureCategoryError,
  CreateFixtureCategoryData,
  UpdateFixtureCategoryData
} from './fixture-category.service'

export type {
  FixtureOptionError,
  CreateFixtureOptionData,
  UpdateFixtureOptionData
} from './fixture-option.service'
