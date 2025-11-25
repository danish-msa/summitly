import React from 'react'
import { notFound } from 'next/navigation'
import { getPreConUnit } from '@/data/mockPreConData'
import UnitDetailPageClient from './UnitDetailPageClient'

interface UnitDetailPageProps {
  params: Promise<{
    slug: string;
    unitId: string;
  }>;
}

const UnitDetailPage: React.FC<UnitDetailPageProps> = async ({ params }) => {
  const { slug, unitId } = await params;
  const unit = getPreConUnit(slug, unitId);

  if (!unit) {
    notFound();
  }

  return <UnitDetailPageClient unit={unit} propertyId={slug} />;
}

export default UnitDetailPage

