"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import PreConstructionBasePage from '@/components/PreCon/PreConstructionBasePage';

const BuilderPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string || '';

  return <PreConstructionBasePage slug={slug} pageType="builder" teamType="builder" />;
};

export default BuilderPage;

