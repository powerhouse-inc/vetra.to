import { gql } from 'graphql-request'

export const FETCH_BUILDER_TEAMS_BY_MEMBER = gql`
  query fetchBuilderTeamsByMember($ethAddress: String!) {
    fetchBuilderTeamsByMember(ethAddress: $ethAddress) {
      id
      profileName
      profileSlug
      profileLogo
      profileDescription
      profileSocialsX
      profileSocialsGithub
      profileSocialsWebsite
      createdAt
      updatedAt
      members {
        id
        ethAddress
      }
      spaces {
        id
        packages {
          id
        }
      }
    }
  }
`

export type ProfileTeamMember = {
  id: string
  ethAddress: string
}

export type ProfileTeamSpace = {
  id: string
  packages: { id: string }[]
}

export type ProfileTeam = {
  id: string
  profileName: string
  profileSlug: string
  profileLogo: string | null
  profileDescription: string | null
  profileSocialsX: string | null
  profileSocialsGithub: string | null
  profileSocialsWebsite: string | null
  createdAt: string
  updatedAt: string
  members: ProfileTeamMember[]
  spaces: ProfileTeamSpace[]
}

export type FetchBuilderTeamsByMemberResponse = {
  fetchBuilderTeamsByMember: ProfileTeam[]
}
