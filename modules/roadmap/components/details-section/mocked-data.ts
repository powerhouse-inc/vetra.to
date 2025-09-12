import { DeliverableStatus, ProgressStatus, type Milestone } from '../milestone-details-card/type'

export const mockedMilestone1: Milestone = {
  id: 'ustpb52jla',
  sequenceCode: 'PH01',
  code: 'POC',
  title: 'Decentralized Operations Platform - POC',
  abstract: 'The initial phase of Powerhouse Decentralized Operations Platform.',
  description:
    'Roadmap milestone: Decentralized Operations Platform - Proof of Concept. Milestone 1, set for March 1, marks the initial phase of Powerhouse Decentralized Operations Platform. Deliverables include: Technical integration demo showcasing for the first time the RWA Portfolio Editor in Connect and the data synchronization with Switchboard; Switchboard API endpoints for integration partners with document model update events and document state queries; and Switchboard API endpoints for integration partners with document model update events and document state queries.',
  targetDate: '2024-03-01T00:00:00.000Z',
  scope: {
    deliverables: [
      {
        id: 'oy69oibt04',
        code: 'POC1',
        title: 'First technical integration of RWA Portfolio (Connect & Switchboard)',
        description:
          'Technical integration demo showcasing for the first time the RWA Portfolio Editor in Connect and the data synchronization with Switchboard.',
        status: DeliverableStatus.DELIVERED,
        keyResults: [
          {
            id: 'e9FdAg63',
            title: 'RWA Conceptual Wireframes',
            link: 'https://drive.google.com/file/d/1NZXm_Q43sKH5pqwHTwN0DYvSW1uewMlY/view',
          },
          {
            id: '710Ed212',
            title: 'First demo of RWA Portfolio - Feb 21',
            link: 'https://drive.google.com/file/d/1CMwePiR046IJqQGLypi7Fzu_B7aLYNco/view',
          },
        ],
        workProgress: {
          __typename: 'Percentage',
          value: 1,
        },
        budgetAnchor: {
          project: {
            code: 'RWA',
            title: 'RWA Portfolio Reporting',
          },
          workUnitBudget: 1,
          deliverableBudget: 0,
        },
        owner: {
          id: '93RF8qO5\n',
          ref: 'skyecosystem/ecosystem-actor',
          name: 'Powerhouse',
          code: 'PH',
          imageUrl:
            'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
        },
      },
      {
        id: 'oy69oibt03',
        code: 'POC2',
        title: 'Integration (API endpoints and Queries)',
        description:
          'Switchboard API endpoints for integration partners with document model update events and document state queries.',
        status: DeliverableStatus.DELIVERED,
        keyResults: [
          {
            id: 'Zmb1aoqR',
            title: 'Source code (Powerhouse repo)',
            link: 'https://github.com/powerhouse-inc/',
          },
          {
            id: '9p92yM7X',
            title: 'Source code (SES repo)',
            link: 'https://github.com/makerdao-ses',
          },
        ],
        workProgress: {
          __typename: 'Percentage',
          value: 1,
        },
        budgetAnchor: {
          project: {
            code: 'PHP',
            title: 'Powerhouse Products POC',
          },
          workUnitBudget: 1,
          deliverableBudget: 0,
        },
        owner: {
          id: '93RF8qO5\n',
          ref: 'skyecosystem/ecosystem-actor',
          name: 'Powerhouse',
          code: 'PH',
          imageUrl:
            'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
        },
      },
      {
        id: 'oy69oibt02',
        code: 'POC3',
        title: 'Expense dashboard increments (on-chain data, budget breakdowns)',
        description:
          'Separate incremental release of the Sky Ecosystem expenses platform with on-chain transactional data and budget breakdown views.',
        status: DeliverableStatus.DELIVERED,
        keyResults: [
          {
            id: '7E7cp06j',
            title: 'Expense Dashboard deployment v0.33.0',
            link: 'https://github.com/makerdao-ses/ecosystem-dashboard/releases/tag/v0.33.0',
          },
        ],
        workProgress: {
          __typename: 'Percentage',
          value: 1,
        },
        budgetAnchor: {
          project: {
            code: 'PEA',
            title: 'Protocol Expense Accounting',
          },
          workUnitBudget: 1,
          deliverableBudget: 0,
        },
        owner: {
          id: '93RF8qO5\n',
          ref: 'skyecosystem/ecosystem-actor',
          name: 'Powerhouse',
          code: 'PH',
          imageUrl:
            'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
        },
      },
    ],
    status: ProgressStatus.FINISHED,
    progress: {
      value: 1,
      __typename: 'Percentage',
    },
    totalDeliverables: 3,
    deliverablesCompleted: 3,
  },
  coordinators: [
    {
      imageUrl: 'N/A',
      code: 'Prometheus',
      name: 'Prometheus',
      ref: 'skyecosystem/contributor',
      id: '0454KB3p',
    },
    {
      imageUrl: 'N/A',
      code: 'teep',
      name: 'teep',
      ref: 'skyecosystem/contributor',
      id: '5Q4UrTDg',
    },
    {
      imageUrl: 'N/A',
      code: 'meraki',
      name: 'meraki',
      ref: 'skyecosystem/contributor',
      id: '11F2ho3q',
    },
    {
      imageUrl: 'N/A',
      code: 'callmeT',
      name: 'callmeT',
      ref: 'skyecosystem/contributor',
      id: 'p7026973',
    },
  ],
  contributors: [
    {
      id: '93RF8qO5\n',
      ref: 'skyecosystem/ecosystem-actor',
      name: 'Powerhouse',
      code: 'PH',
      imageUrl:
        'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
    },
  ],
}

export const mockedMilestone2: Milestone = {
  id: 'e7c86wa1g0',
  sequenceCode: 'PH02',
  code: 'MVP',
  title: 'Decentralized Operations Platform - MVP',
  abstract: 'The advanced phase of Powerhouse Decentralized Operations Platform.',
  description:
    'Roadmap milestone: Decentralized Operations Platform - Minimal Viable Product. Milestone 2, set for July 3, marks the continuation phase of Powerhouse Decentralized Operations Platform. Deliverables include: MVP Release with Sky Ecosystem transparency reporting information that can be shared publicly; Delivery of integrated platform consisting of Powerhouse core products (Fusion, Switchboard, Connect, and the first release of Renown).',
  targetDate: '2024-07-02T23:00:00.000Z',
  scope: {
    deliverables: [
      {
        id: 'xnatzcr1mn',
        code: 'MVP1',
        title: 'MVP release of the Sky Ecosystem transparency reporting information.',
        description:
          'MVP Release with Sky Ecosystem transparency reporting information that can be shared publicly. \n* RWA reporting flow (without e2e encryption & comparison views) \n* DAO finances (advanced stage) \n* DAO teams (at least core unit + ecosystem actor profiles) \n* DAO work (projects & roadmaps in early stage) \n* Endgame overview (latest updates & budget insights) \n* New homepage with at-glance insights on various DAO aspects - Finances, governance, Teams, and Work (reskin implemented).',
        status: DeliverableStatus.DELIVERED,
        keyResults: [
          {
            id: '32q22nhV',
            title: 'Integration Demo of RWA portfolio - Apr 10',
            link: 'https://drive.google.com/file/d/1Q1zYh1_qosF8JG1z3gbKszrp60HlnYyV/view',
          },
          {
            id: 'Y9988fTx',
            title: 'Switchboard data / API endpoint ',
            link: 'https://makerdao-ses.notion.site/RWA-API-Query-Key-Result-889eab4be0144d799650620794694916',
          },
          {
            id: 'S4e9R095',
            title: 'Sky Ecosystem platform demo - Jul 3rd',
            link: 'https://drive.google.com/file/d/1f-h8mPCUw4u5gCFn-TQcTw_XIDN7Ayvs/view',
          },
          {
            id: '15vH9w19',
            title: 'PH EA update 1/3 - Powerhouse vision',
            link: 'https://forum.makerdao.com/t/ea-status-update-1-3-detailing-the-powerhouse-vision/24586',
          },
          {
            id: 'EI9U4XpD',
            title: 'Fusion Reskin example designs',
            link: 'https://www.figma.com/proto/dX0ZItTTMaJ78Tsv8kZDlW/Expense-Dashboard-Update?page-id=2417%3A84822&node-id=2417-85288&viewport=465%2C761%2C0.28&t=wu9jjPYjDEC2tmDl-1&scaling=min-zoom&content-scaling=fixed',
          },
          {
            id: '6757Y1F6',
            title: 'Sky deployment of PH products WIP demo - Aug14',
            link: 'https://drive.google.com/file/d/1DGyS4sa1yGgM-pePcbuIYmkki-QlCLzq/view?usp=sharing',
          },
        ],
        workProgress: {
          __typename: 'Percentage',
          value: 1,
        },
        budgetAnchor: {
          project: {
            code: 'RWA',
            title: 'RWA Portfolio Reporting',
          },
          workUnitBudget: 1,
          deliverableBudget: 0,
        },
        owner: {
          id: '93RF8qO5\n',
          ref: 'skyecosystem/ecosystem-actor',
          name: 'Powerhouse',
          code: 'PH',
          imageUrl:
            'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
        },
      },
      {
        id: 'xnatzcr2mn',
        code: 'MVP2',
        title: 'Integrated Powerhouse Platform delivery including Renown',
        description:
          'Delivery of integrated platform consisting of Powerhouse core products: Fusion, Switchboard, Connect, and the first release of Renown. \n* Enhanced expenses.Sky Ecosystem.network rebranded as Fusion \n* Switchboard API endpoints that contain the RWA Portfolio Reporting queries. \n* Other data presented on Fusion will be partially served through Switchboard and partially through the legacy ecosystem API.',
        status: DeliverableStatus.DELIVERED,
        keyResults: [
          {
            id: '1485m8e7',
            title: 'Sky Connect ',
            link: 'https://connect.sky.money/',
          },
          {
            id: '93t823A2',
            title: 'Fusion deployment',
            link: 'https://staging.fusion.phd/',
          },
          {
            id: '3b7661G2',
            title: 'Switchboard deployment ',
            link: 'https://switchboard.sky.money/',
          },
          {
            id: '994Vq00C',
            title: 'Renown deployment ',
            link: 'https://www.renown.id/',
          },
          {
            id: '57594a70',
            title: 'Fusion Github repo',
            link: 'https://github.com/powerhouse-inc/fusion/',
          },
          {
            id: '86fl0GBz',
            title: 'Switchboard Github repo',
            link: 'https://github.com/powerhouse-inc/switchboard',
          },
          {
            id: 'CW070J92',
            title: 'Connect Github repo',
            link: 'https://github.com/powerhouse-inc/connect',
          },
        ],
        workProgress: {
          __typename: 'Percentage',
          value: 1,
        },
        budgetAnchor: {
          project: {
            code: 'PHP',
            title: 'Powerhouse Products POC',
          },
          workUnitBudget: 1,
          deliverableBudget: 0,
        },
        owner: {
          id: '93RF8qO5\n',
          ref: 'skyecosystem/ecosystem-actor',
          name: 'Powerhouse',
          code: 'PH',
          imageUrl:
            'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
        },
      },
    ],
    status: ProgressStatus.FINISHED,
    progress: {
      value: 1,
      __typename: 'Percentage',
    },
    totalDeliverables: 2,
    deliverablesCompleted: 2,
  },
  coordinators: [
    {
      imageUrl: 'N/A',
      code: 'Prometheus',
      name: 'Prometheus',
      ref: 'skyecosystem/contributor',
      id: '0454KB3p',
    },
    {
      imageUrl: 'N/A',
      code: 'teep',
      name: 'teep',
      ref: 'skyecosystem/contributor',
      id: '5Q4UrTDg',
    },
    {
      imageUrl: 'N/A',
      code: 'meraki',
      name: 'meraki',
      ref: 'skyecosystem/contributor',
      id: '11F2ho3q',
    },
    {
      imageUrl: 'N/A',
      code: 'callmeT',
      name: 'callmeT',
      ref: 'skyecosystem/contributor',
      id: 'p7026973',
    },
  ],
  contributors: [
    {
      id: '93RF8qO5\n',
      ref: 'skyecosystem/ecosystem-actor',
      name: 'Powerhouse',
      code: 'PH',
      imageUrl:
        'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
    },
  ],
}

export const mockedMilestone3: Milestone = {
  id: 'luc6t7m18q',
  sequenceCode: 'PH03',
  code: 'PROD',
  title: 'Decentralized Operations Platform - Production',
  abstract:
    'Work on polished and production-grade version of Powerhouse Decentralized Operations Platform.',
  description:
    'Roadmap milestone: Decentralized Operations Platform - Production release.\nMilestone 3, set for Q4, marks the production grade development phase of Powerhouse Decentralized Operations Platform.\nDeliverables include: (scope not final) Production grade release of the Sky Ecosystem transparency reporting information; integrated Powerhouse platform.',
  targetDate: '2024-11-01T00:00:00.000Z',
  scope: {
    deliverables: [
      {
        id: 't4wjsoym8u',
        code: 'PROD1',
        title: 'Sky Fusion Production Release',
        description:
          'Sky rebrand of Fusion, including staging & production deployment on the sky.money subdomains with the latest available ecosystem data.',
        status: DeliverableStatus.DELIVERED,
        keyResults: [
          {
            id: 'xf14lCx1',
            title: 'Custom Sky Fusion deployment',
            link: 'https://fusion.sky.money/',
          },
          {
            id: 'IC2976w0',
            title: 'Sky Fusion Staging Release',
            link: 'https://fusion-staging.sky.money/',
          },
          {
            id: '987eb3gd',
            title: 'Sky Fusion Production Release',
            link: 'https://fusion.sky.money/',
          },
        ],
        workProgress: {
          __typename: 'Percentage',
          value: 1,
        },
        budgetAnchor: {
          project: {
            code: 'PEA',
            title: ' Protocol Expense Accounting',
          },
          workUnitBudget: 1,
          deliverableBudget: 0,
        },
        owner: {
          id: '93RF8qO5\n',
          ref: 'skyecosystem/ecosystem-actor',
          name: 'Powerhouse',
          code: 'PH',
          imageUrl:
            'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
        },
      },
      {
        id: 't4wjsoym9u',
        code: 'PROD2',
        title: 'Sky Connect Production Release',
        description:
          'Sky rebrand of Connect, including staging & production deployment on the sky.money subdomains  with the available Real World Assets reports data.',
        status: DeliverableStatus.DELIVERED,
        keyResults: [
          {
            id: '242NG4NT',
            title: 'Sky Connect Staging Release',
            link: 'https://connect-staging.sky.money/',
          },
          {
            id: '4o7T4W66',
            title: 'Sky Connect Production Release',
            link: 'https://connect.sky.money/',
          },
        ],
        workProgress: {
          __typename: 'Percentage',
          value: 1,
        },
        budgetAnchor: {
          project: {
            code: 'PHP',
            title: 'Powerhouse Products POC',
          },
          workUnitBudget: 1,
          deliverableBudget: 0,
        },
        owner: {
          id: '93RF8qO5\n',
          ref: 'skyecosystem/ecosystem-actor',
          name: 'Powerhouse',
          code: 'PH',
          imageUrl:
            'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
        },
      },
      {
        id: 't4wjsoyrru',
        code: 'PROD3',
        title: 'Sky Switchboard Production Release',
        description:
          'Sky rebrand of Switchboard, including staging & production deployment on the sky.money subdomains, including latest available RWA & ecosystem data. ',
        status: DeliverableStatus.IN_PROGRESS,
        keyResults: [
          {
            id: 'roGS2u4e',
            title: 'Sky Switchboard Staging Release ',
            link: 'https://switchboard-staging.sky.money/',
          },
          {
            id: 'lT5jxmp3',
            title: 'Sky Switchboard Production Release ',
            link: 'https://switchboard.sky.money/',
          },
        ],
        workProgress: {
          __typename: 'Percentage',
          value: 0.9,
        },
        budgetAnchor: {
          project: {
            code: 'PHP',
            title: 'Powerhouse Products POC',
          },
          workUnitBudget: 1,
          deliverableBudget: 0,
        },
        owner: {
          id: '93RF8qO5\n',
          ref: 'skyecosystem/ecosystem-actor',
          name: 'Powerhouse',
          code: 'PH',
          imageUrl:
            'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
        },
      },
      {
        id: 't4wjsoywdu',
        code: 'PROD4',
        title: 'Renown.id Production Release',
        description:
          'Sky rebrand of PRODUCT, including staging & production deployment on the sky.money domain. ',
        status: DeliverableStatus.IN_PROGRESS,
        keyResults: [
          {
            id: 'd50IeYtN',
            title: 'Renown.id Production Release',
            link: 'https://www.renown.id/ ',
          },
        ],
        workProgress: {
          __typename: 'Percentage',
          value: 0.9,
        },
        budgetAnchor: {
          project: {
            code: 'PHP',
            title: 'Powerhouse Products POC',
          },
          workUnitBudget: 1,
          deliverableBudget: 0,
        },
        owner: {
          id: '93RF8qO5\n',
          ref: 'skyecosystem/ecosystem-actor',
          name: 'Powerhouse',
          code: 'PH',
          imageUrl:
            'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
        },
      },
    ],
    status: ProgressStatus.IN_PROGRESS,
    progress: {
      value: 0.92,
      __typename: 'Percentage',
    },
    totalDeliverables: 4,
    deliverablesCompleted: 2,
  },
  coordinators: [
    {
      imageUrl: 'N/A',
      code: 'Prometheus',
      name: 'Prometheus',
      ref: 'skyecosystem/contributor',
      id: '0454KB3p',
    },
    {
      imageUrl: 'N/A',
      code: 'teep',
      name: 'teep',
      ref: 'skyecosystem/contributor',
      id: '5Q4UrTDg',
    },
    {
      imageUrl: 'N/A',
      code: 'meraki',
      name: 'meraki',
      ref: 'skyecosystem/contributor',
      id: '11F2ho3q',
    },
    {
      imageUrl: 'N/A',
      code: 'callmeT',
      name: 'callmeT',
      ref: 'skyecosystem/contributor',
      id: 'p7026973',
    },
  ],
  contributors: [
    {
      id: '93RF8qO5\n',
      ref: 'skyecosystem/ecosystem-actor',
      name: 'Powerhouse',
      code: 'PH',
      imageUrl:
        'https://makerdao-ses.github.io/ecosystem-dashboard/ecosystem-actors/POWERHOUSE/POWERHOUSE_logo.png',
    },
  ],
}
