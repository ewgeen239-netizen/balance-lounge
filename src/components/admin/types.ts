export type AdminItem = {
  id: number;
  categoryId: number;
  name: string; // JSON
  description: string; // JSON
  price: number;
  photo: string;
  available: boolean;
  badges: string; // JSON
  order: number;
};

export type AdminCategory = {
  id: number;
  slug: string;
  name: string; // JSON
  order: number;
  scheduled: boolean;
  items: AdminItem[];
};

export type AdminReservation = {
  id: number;
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
  comment: string;
  zone: string;
  status: string;
  createdAt: string;
};

export type AdminBar = {
  id: number;
  name: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  telegram: string;
  lat: number;
  lng: number;
  heroImage: string;
  heroNeon: string;
  gallery: string;
};

export type AdminAbout = {
  id: number;
  heading: string;
  subheading: string;
  body: string;
  images: string;
};
