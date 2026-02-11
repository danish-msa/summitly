"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import PreConstructionBasePage from '@/components/PreCon/PreConstructionBasePage';

const ArchitectPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string || '';

  return <PreConstructionBasePage slug={slug} pageType="architect" teamType="architect" />;
};

export default ArchitectPage;

