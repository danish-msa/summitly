import React from 'react'
import { notFound } from 'next/navigation'
import { getPreConUnit } from '@/data/mockPreConData'
import UnitDetailPageClient from './UnitDetailPageClient'

interface UnitDetailPageProps {
  params: Promise<{
    id: string;
    unitId: string;
  }>;
}

const UnitDetailPage: React.FC<UnitDetailPageProps> = async ({ params }) => {
  const { id, unitId } = await params;
  const unit = getPreConUnit(id, unitId);

  if (!unit) {
    notFound();
  }

  return <UnitDetailPageClient unit={unit} propertyId={id} />;
}

export default UnitDetailPage
