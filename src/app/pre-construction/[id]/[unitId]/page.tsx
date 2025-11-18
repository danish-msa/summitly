import React from 'react'
import { notFound } from 'next/navigation'
import { getPreConUnit } from '@/data/mockPreConData'
import UnitDetailPageClient from './UnitDetailPageClient'

interface UnitDetailPageProps {
  params: {
    id: string;
    unitId: string;
  };
}

const UnitDetailPage: React.FC<UnitDetailPageProps> = async ({ params }) => {
  const unit = getPreConUnit(params.id, params.unitId);

  if (!unit) {
    notFound();
  }

  return <UnitDetailPageClient unit={unit} propertyId={params.id} />;
}

export default UnitDetailPage
