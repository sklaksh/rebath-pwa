// Export all services
export { authService } from './auth.service'
export { assessmentService } from './assessment.service'
export { pricingService } from './pricing.service'
export { projectService } from './project.service'
export { roomService } from './room.service'

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
  FixtureOption,
  SelectedFixture,
  PricingData,
  QuoteData,
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
