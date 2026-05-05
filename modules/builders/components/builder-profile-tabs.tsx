'use client'

import React from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'

interface BuilderProfileTabsProps {
  packagesContent: React.ReactNode
  teamContent: React.ReactNode
  aboutContent: React.ReactNode
}

export function BuilderProfileTabs({
  packagesContent,
  teamContent,
  aboutContent,
}: BuilderProfileTabsProps) {
  return (
    <Tabs defaultValue="packages" className="w-full">
      <TabsList>
        <TabsTrigger value="packages">Packages</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
      </TabsList>
      <TabsContent value="packages" className="mt-6">
        {packagesContent}
      </TabsContent>
      <TabsContent value="team" className="mt-6">
        {teamContent}
      </TabsContent>
      <TabsContent value="about" className="mt-6">
        {aboutContent}
      </TabsContent>
    </Tabs>
  )
}
