import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Building2, Palette, Hammer, Sprout, Megaphone, LucideIcon } from 'lucide-react'
import { PropertyListing } from '@/lib/types'
import TeamMemberCard, { TeamMember } from './TeamMemberCard'

interface TeamMemberConfig {
  key: string
  value: string
  label: string
  icon: LucideIcon
}

const TEAM_MEMBER_CONFIGS: TeamMemberConfig[] = [
  { key: 'developer', value: 'developer', label: 'Developer', icon: Building2 },
  { key: 'architect', value: 'architect', label: 'Architect', icon: Building2 },
  {
    key: 'interiorDesigner',
    value: 'interior-designer',
    label: 'Interior Designer',
    icon: Palette,
  },
  { key: 'builder', value: 'builder', label: 'Builder', icon: Hammer },
  {
    key: 'landscapeArchitect',
    value: 'landscape-architect',
    label: 'Landscape',
    icon: Sprout,
  },
  { key: 'marketing', value: 'marketing', label: 'Marketing', icon: Megaphone },
]

interface DevelopmentTeamSectionProps {
  developmentTeam: NonNullable<PropertyListing['preCon']>['developmentTeam']
}

const DevelopmentTeamSection: React.FC<DevelopmentTeamSectionProps> = ({ developmentTeam }) => {
  const availableMembers = useMemo(() => {
    return TEAM_MEMBER_CONFIGS.filter((config) => {
      const member = developmentTeam?.[config.key as keyof typeof developmentTeam] as
        | TeamMember
        | undefined
      return member !== undefined
    })
  }, [developmentTeam])

  const defaultTab = useMemo(() => {
    const firstAvailable = availableMembers[0]
    return firstAvailable?.value || 'developer'
  }, [availableMembers])

  if (!developmentTeam || availableMembers.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Development Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Team Overview */}
        {developmentTeam.overview && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {developmentTeam.overview}
            </p>
          </div>
        )}

        {/* Team Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 gap-1">
            {availableMembers.map((config) => (
              <TabsTrigger key={config.key} value={config.value} className="text-xs md:text-sm py-2">
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableMembers.map((config) => {
            const member = developmentTeam[
              config.key as keyof typeof developmentTeam
            ] as TeamMember | undefined

            if (!member) return null

            return (
              <TabsContent key={config.key} value={config.value} className="mt-6">
                <TeamMemberCard member={member} icon={config.icon} />
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default DevelopmentTeamSection

