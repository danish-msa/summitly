"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import PreConstructionBasePage from '@/components/PreCon/PreConstructionBasePage';

const InteriorDesignerPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string || '';

  return <PreConstructionBasePage slug={slug} pageType="interior-designer" teamType="interior-designer" />;
};

export default InteriorDesignerPage;

