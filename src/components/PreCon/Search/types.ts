export interface PreConCity {
  id: string;
  name: string;
  image: string;
  numberOfProjects?: number;
}

export interface PreConLaunch {
  id: string;
  title: string;
}

export interface PreConSellingStatus {
  id: string; // slugified status (e.g., "now-selling")
  name: string; // formatted name (e.g., "Now Selling")
  numberOfProjects?: number;
}

