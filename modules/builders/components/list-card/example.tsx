import React from 'react'
import { BuilderTeamCard } from './index'

// Example usage of the BuilderTeamCard component
const ExampleUsage: React.FC = () => {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Builder Team Cards</h2>

      {/* Example with all links */}
      <BuilderTeamCard
        teamName="Acme Builders"
        description="A cutting-edge development team specializing in blockchain infrastructure and decentralized applications. We build the future of web3 with passion and precision."
        xUrl="https://x.com/acmebuilders"
        githubUrl="https://github.com/acmebuilders"
        websiteUrl="https://acmebuilders.com"
        actions={[
          { link: 'https://acmebuilders.com/profile', title: 'View Profile' },
          { link: 'https://acmebuilders.com/portfolio', title: 'Portfolio' },
        ]}
      />

      {/* Example with minimal links */}
      <BuilderTeamCard
        teamName="Crypto Pioneers"
        description="Innovative blockchain developers creating next-generation DeFi protocols and smart contract solutions."
        githubUrl="https://github.com/cryptopioneers"
        websiteUrl="https://cryptopioneers.io"
        actions={[{ link: 'https://cryptopioneers.io/team', title: 'Meet the Team' }]}
      />

      {/* Example with no actions */}
      <BuilderTeamCard
        teamName="Web3 Warriors"
        description="Building the decentralized future, one smart contract at a time."
        xUrl="https://x.com/web3warriors"
      />
    </div>
  )
}

export default ExampleUsage
