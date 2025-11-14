import { notFound } from 'next/navigation'
import { BuilderProfile } from '@/modules/builders/components/builder-profile'
import { BuilderSpaces } from '@/modules/builders/components/builder-spaces'
import { TeamMembers } from '@/modules/builders/components/team-members'
import { fetchBuilderTeamBySlug, type BuilderSpace } from '@/modules/builders/lib/server-data'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/modules/shared/components/ui/breadcrumb'

// Force dynamic rendering to prevent build-time API requests
export const dynamic = 'force-dynamic'

interface TeamPageProps {
  params: {
    'team-name': string
  }
}

export async function generateMetadata({ params }: TeamPageProps): Promise<unknown> {
  try {
    const teamSlug = (await params)['team-name']
    const teamData = await fetchBuilderTeamBySlug(teamSlug)

    if (!teamData) {
      return {
        title: 'Builder Not Found',
        description: 'The requested builder team could not be found.',
      }
    }

    const title = `${teamData.profileName || teamSlug} | Vetra Builder`
    const description =
      teamData.profileDescription ||
      `Explore ${teamData.profileName || teamSlug} builder profile on Vetra.`
    const url = `https://vetra.to/builders/${teamSlug}`
    const ogImage = teamData.profileLogo || 'https://vetra.to/vetra-logo.png'

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: 'Vetra',
        type: 'profile',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: teamData.profileName || teamSlug,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
        site: '@vetra',
        creator: teamData.profileSocialsX,
      },
      alternates: {
        canonical: url,
      },
    }
  } catch {
    // Fallback metadata if fetch fails
    return {
      title: 'Vetra Builder',
      description: 'Explore builder profiles on Vetra.',
    }
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const teamSlug = (await params)['team-name']

  // Fetch team data by slug
  const teamData = await fetchBuilderTeamBySlug(teamSlug)

  // If no team data found, show 404
  if (!teamData) {
    notFound()
  }

  // Transform the team data to match the expected format
  const spaces =
    teamData.spaces?.length > 0
      ? teamData.spaces.map((space) => ({
          title: space.title || 'Team Packages',
          description: space.description,
          packages:
            space.packages?.map((pkg) => ({
              title: pkg.name || 'Unknown Package',
              description: pkg.description || 'Package description',
              githubUrl: pkg.githubUrl,
              npmUrl: pkg.npmUrl,
              vetraDriveUrl: pkg.vetraDriveUrl,
            })) || [],
        }))
      : []

  // Transform team members data
  const teamMembers =
    teamData.members?.map((member) => ({
      id: member.id,
      phid: member.phid,
      ethAddress: member.ethAddress,
      name: member.name,
      avatar: member.profileImage,
      role: 'Developer',
      isRenown: !!member.phid, // Show renown link if phid exists
    })) || []

  // Generate industry expertise from package categories
  const industryExpertise = Array.from(
    new Set(
      teamData.spaces
        ?.flatMap(
          (space: BuilderSpace) => space.packages?.map((pkg) => pkg.category).filter(Boolean) || [],
        )
        .filter(Boolean) || [],
    ),
  ).filter((expertise): expertise is string => expertise !== undefined)

  return (
    <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Builder Profile - {teamData.profileName}</h1>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/builders">Builders</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Builder Profile Section */}
      <BuilderProfile
        profileName={teamData.profileName}
        profileLogo={teamData.profileLogo}
        profileDescription={teamData.profileDescription}
        profileSocialsX={teamData.profileSocialsX}
        profileSocialsGithub={teamData.profileSocialsGithub}
        profileSocialsWebsite={teamData.profileSocialsWebsite}
        industryExpertise={industryExpertise}
      />

      {/* Team Members Section */}
      {teamMembers.length > 0 && <TeamMembers members={teamMembers} />}

      {/* Builder Spaces Section */}
      <BuilderSpaces
        spaces={spaces}
        teamName={teamData.profileName || teamSlug}
        discordUrl="https://discord.com/invite/powerhouse"
      />
    </main>
  )
}
