"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MarketReports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Market Reports</h2>
        <p className="text-muted-foreground">Stay informed about market trends and analytics</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Comprehensive market reports and analytics will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

