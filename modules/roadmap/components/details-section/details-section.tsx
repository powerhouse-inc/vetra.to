import { MilestoneDetailsCard } from '../milestone-details-card'
import { SectionTitle } from '../section-title'
import { mockedMilestone1, mockedMilestone2, mockedMilestone3 } from './mocked-data'

export default function DetailsSection() {
  return (
    <div className="mt-6">
      <SectionTitle title="Milestones Roadmap Details" />

      <div className="mt-6 flex flex-col gap-10 md:mt-8 md:gap-8">
        <MilestoneDetailsCard milestone={mockedMilestone1} />
        <MilestoneDetailsCard milestone={mockedMilestone2} />
        <MilestoneDetailsCard milestone={mockedMilestone3} />
      </div>
    </div>
  )
}
