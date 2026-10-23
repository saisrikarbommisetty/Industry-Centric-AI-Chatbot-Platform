import bcrypt from 'bcryptjs';
import { prisma, isDatabaseConnected, connectDatabase } from './database';
import { projectRepository } from '../repositories/project.repository';
import { userRepository } from '../repositories/user.repository';
import { knowledgeRepository } from '../repositories/knowledge.repository';
import { leadRepository } from '../repositories/lead.repository';
import { analyticsRepository } from '../repositories/analytics.repository';
import { logger } from '../utils/logger';

export async function seedDatabase() {
  logger.info('🌱 Starting Database Seeding...');
  await connectDatabase();

  // 1. Seed Demo User
  logger.info('Creating demo user: saisrikar@example.com');
  const user = await userRepository.create({
    name: 'Sai Srikar',
    email: 'saisrikar@example.com',
    password: 'saisrikarbrim@123',
    organization: 'BRIM Workspace',
    role: 'CLIENT_DIRECTOR',
  });
  logger.info(`User ready: ${user.name} (${user.email})`);

  // 2. Seed Prycoons Project
  logger.info('Creating primary project: Prycoons Real Estate Assistant');
  const prycoons = await projectRepository.create({
    id: 'prycoons-ai',
    name: 'BRIM Real Estate Assistant',
    slug: 'prycoons-ai',
    industry: 'real-estate',
    industryName: 'Real Estate & Property',
    websiteUrl: 'https://prycoons.com/',
    description: 'Conversational assistant for Prycoons Real Estate. Naturally guides visitors through luxury apartments, BHK configurations, project pricing, brochures, and visit bookings.',
    systemInstructions: 'Represent Prycoons Real Estate with human warmth and consultative expertise. Ask one natural question at a time. Mix personal lifestyle questions with property criteria, summarize matches, offer WhatsApp shortlist delivery, and connect to advisors.',
    avatar: '🏢',
    primaryColor: '#C85C4A',
    tone: 'Warm, Consultative & Friendly',
    welcomeMessage: "Hi 👋 Welcome to BRIM Real Estate Assistant! I'm here to help you explore properties and find a home that suits your needs. What should I call you?",
    suggestedQuestions: ['Looking to Buy 🏡', 'Thinking of Renting 🔑', 'Just Browsing ✨', 'Explore properties'],
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    isActive: true,
  });

  // 3. Seed Marketing Project
  logger.info('Creating secondary project: Apex Brand Studio');
  await projectRepository.create({
    id: 'apex-brand-ai',
    name: 'Apex Creative & Branding Assistant',
    slug: 'apex-brand-ai',
    industry: 'marketing',
    industryName: 'Marketing & Creative Agency',
    websiteUrl: 'https://apexbrand.studio/',
    description: 'Brand identity, UI/UX design, performance social marketing, and client intake assistant with location-aware trend conversations.',
    systemInstructions: 'Understand client brand stories, discover their creative & marketing requirements, mix light aesthetic questions with strategic goals, share portfolio one-liners, and capture leads.',
    avatar: '⚡',
    primaryColor: '#2A7E8C',
    tone: 'Creative, Friendly & Consultative',
    welcomeMessage: 'Hi there 👋 Good day! Welcome to Apex Brand Studio. I’m Maya. May I know your name?',
    suggestedQuestions: ['Eco-friendly startup 🌱', 'Brand identity & logo 🎨', 'Website & UX design 💻', 'Social media growth 📈'],
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    isActive: true,
  });

  // 4. Seed Initial Knowledge Sources & Verified Chunks for Prycoons
  logger.info('Seeding initial verified knowledge sources...');
  const srcGota = await knowledgeRepository.createSource({
    id: 'src-gota-3bhk',
    projectId: prycoons.id,
    url: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/',
    title: 'Gota New Flat Scheme - 3 BHK Apartments in Gota | Prycoons',
    type: 'URL',
    status: 'INDEXED',
    size: '184 KB',
    extractedSummary: 'Verified listings for 3 BHK apartments in Gota including Ananta (by Dharti Saket) from ₹92 lakh onwards and Satyamev Serene from ₹1.4 crore onwards.',
  });

  const docGota = await knowledgeRepository.createDocument({
    id: 'doc-gota-3bhk',
    sourceId: srcGota.id,
    projectId: prycoons.id,
    title: '3 BHK Flats in Gota Ahmedabad',
    url: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/',
    content: 'Ananta (by Dharti Saket) – 3 BHK Gota, Ahmedabad, 1863 - 2079 Sq Ft Super Built Up Area, Price: ₹92 lakh Onwards, Status: Under Construction, Rera Approved.\nSatyamev Serene – 3 BHK Gota, Ahmedabad, 2223 - 2268 Sq Ft Super Built Up Area, Price: ₹1.4 crore Onwards, Status: Under Construction, Rera Approved.',
    metadata: { location: 'Gota', city: 'Ahmedabad', propertyType: '3BHK' },
    contentHash: 'hash-gota-verified',
  });

  await knowledgeRepository.createChunk({
    id: 'chk-ananta-gota',
    documentId: docGota.id,
    projectId: prycoons.id,
    content: `Project: Ananta\nDeveloper: Dharti Saket\nLocation: Gota, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹92 lakh Onwards\nArea: 1863 - 2079 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Landscaped Garden, Gymnasium, Children's Play Area, High-speed EV Parking, 24/7 Security\nAddress: Gota, Ghatlodiya Taluka, Ahmedabad District, Gujarat, 382481, India\nSource: https://prycoons.com/property/ananta-in-gota-ahmedabad/`,
    metadata: {
      projectName: 'Ananta',
      developer: 'Dharti Saket',
      location: 'Gota',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹92 lakh Onwards',
      priceNum: 92,
      carpetArea: '1863 - 2079 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/ananta-in-gota-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/ananta-in-gota-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2024/02/E_Anantaby-Dharti-Saket-584x438.webp',
      amenities: ['Landscaped Garden', 'Gymnasium', "Children's Play Area", 'High-speed EV Parking'],
    },
    chunkIndex: 0,
  });

  await knowledgeRepository.createChunk({
    id: 'chk-satyamev-gota',
    documentId: docGota.id,
    projectId: prycoons.id,
    content: `Project: Satyamev Serene\nDeveloper: Satyamev Group\nLocation: Gota, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹1.4 crore Onwards\nArea: 2223 - 2268 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Zen Garden, Clubhouse, Swimming Pool, Banquet Hall\nAddress: Gota, Ghatlodiya Taluka, Ahmedabad District, Gujarat, 382481, India\nSource: https://prycoons.com/property/satyamev-serene-in-gota-ahmedabad/`,
    metadata: {
      projectName: 'Satyamev Serene',
      developer: 'Satyamev Group',
      location: 'Gota',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹1.4 crore Onwards',
      priceNum: 140,
      carpetArea: '2223 - 2268 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/satyamev-serene-in-gota-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/satyamev-serene-in-gota-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2024/02/Satyamev_Int_IMPACT3D-3-584x438.webp',
      amenities: ['Zen Garden', 'Clubhouse', 'Swimming Pool', 'Banquet Hall'],
    },
    chunkIndex: 1,
  });

  // 4b. Seed 2 BHK Flats in Gota Knowledge Source & Chunks
  const srcGota2Bhk = await knowledgeRepository.createSource({
    id: 'src-gota-2bhk',
    projectId: prycoons.id,
    url: 'https://prycoons.com/2-bhk-flats-in-gota-ahmedabad/',
    title: 'Gota New Flat Scheme - 2 BHK Flats in Gota Ahmedabad | Prycoons',
    type: 'URL',
    status: 'INDEXED',
    size: '175 KB',
    extractedSummary: 'Verified listings for 2 BHK flats in Gota including Shubh Green (from ₹52 lakh onwards) and Satyaa Heights (from ₹58 lakh onwards).',
  });

  const docGota2Bhk = await knowledgeRepository.createDocument({
    id: 'doc-gota-2bhk',
    sourceId: srcGota2Bhk.id,
    projectId: prycoons.id,
    title: '2 BHK Flats in Gota Ahmedabad',
    url: 'https://prycoons.com/2-bhk-flats-in-gota-ahmedabad/',
    content: 'Shubh Green – 2 BHK Gota, Ahmedabad, 1260 - 1440 Sq Ft Super Built Up Area, Price: ₹52 lakh Onwards, Status: Ready to Move, RERA Approved.\nSatyaa Heights – 2 BHK Gota, Ahmedabad, 1350 - 1530 Sq Ft Super Built Up Area, Price: ₹58 lakh Onwards, Status: Under Construction, RERA Approved.',
    metadata: { location: 'Gota', city: 'Ahmedabad', propertyType: '2BHK' },
    contentHash: 'hash-gota-2bhk-verified',
  });

  await knowledgeRepository.createChunk({
    id: 'chk-shubh-gota',
    documentId: docGota2Bhk.id,
    projectId: prycoons.id,
    content: `Project: Shubh Green\nDeveloper: Shubh Developers\nLocation: Gota, Ahmedabad\nConfiguration: 2 BHK\nPrice: ₹52 lakh Onwards\nArea: 1260 - 1440 Sq Ft Super Built Up Area\nStatus: Ready to Move (RERA Approved)\nAmenities: Landscaped Garden, Dedicated Parking, 24/7 Security, Elevators, Children Play Area\nAddress: Near Vandematram Cross Road, Gota, Ahmedabad, Gujarat, 382481, India\nSource: https://prycoons.com/property/shubh-green-in-tragad-ahmedabad/`,
    metadata: {
      projectName: 'Shubh Green',
      developer: 'Shubh Developers',
      location: 'Gota',
      propertyType: '2BHK',
      bhk: '2 BHK',
      price: '₹52 lakh Onwards',
      priceNum: 52,
      carpetArea: '1260 - 1440 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/shubh-green-in-tragad-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/shubh-green-in-tragad-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2024/02/Shubh-Green_07-584x438.webp',
      amenities: ['Landscaped Garden', 'Dedicated Parking', '24/7 Security', 'Children Play Area'],
    },
    chunkIndex: 0,
  });

  await knowledgeRepository.createChunk({
    id: 'chk-satyaa-gota',
    documentId: docGota2Bhk.id,
    projectId: prycoons.id,
    content: `Project: Satyaa Heights\nDeveloper: Satyaa Infracon\nLocation: Gota, Ahmedabad\nConfiguration: 2 BHK\nPrice: ₹58 lakh Onwards\nArea: 1350 - 1530 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Clubhouse, Gym, EV Charging, Senior Citizen Sit-out, CCTV\nAddress: Off SG Highway, Gota, Ahmedabad, Gujarat, 382481, India\nSource: https://prycoons.com/property/satyaa-heights-in-tragad-ahmedabad/`,
    metadata: {
      projectName: 'Satyaa Heights',
      developer: 'Satyaa Infracon',
      location: 'Gota',
      propertyType: '2BHK',
      bhk: '2 BHK',
      price: '₹58 lakh Onwards',
      priceNum: 58,
      carpetArea: '1350 - 1530 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/satyaa-heights-in-tragad-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/satyaa-heights-in-tragad-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2025/11/SATYAA-HEIGHT_4-584x438.webp',
      amenities: ['Clubhouse', 'Gym', 'EV Charging', 'Senior Citizen Sit-out'],
    },
    chunkIndex: 1,
  });

  // 5. Seed Tragad Knowledge Source & Chunks
  const srcTragad = await knowledgeRepository.createSource({
    id: 'src-tragad-3bhk',
    projectId: prycoons.id,
    url: 'https://prycoons.com/3-bhk-flats-in-tragad-ahmedabad/',
    title: '3 BHK Flats in Tragad Ahmedabad | Prycoons',
    type: 'URL',
    status: 'INDEXED',
    size: '190 KB',
    extractedSummary: 'Verified listings for 3 BHK apartments in Tragad including B R Ekayan, Shyam Heights 1, The Nilyam, Siddharth Gardenia, Aryamaan Glory, and Shreehari Skyleaf.',
  });

  const docTragad = await knowledgeRepository.createDocument({
    id: 'doc-tragad-3bhk',
    sourceId: srcTragad.id,
    projectId: prycoons.id,
    title: '3 BHK Flats in Tragad Ahmedabad',
    url: 'https://prycoons.com/3-bhk-flats-in-tragad-ahmedabad/',
    content: 'Verified Tragad projects: B R Ekayan (3 BHK, 2313 - 2565 Sq Ft, ₹95 lakh Onwards), Shyam Heights 1 (₹68 lakh Onwards, 2/3 BHK), The Nilyam (₹80 lakh Onwards, 3 BHK, 1899 Sq Ft), Siddharth Gardenia (₹76 lakh Onwards, 3 BHK, 1872 - 2097 Sq Ft).',
    metadata: { location: 'Tragad', city: 'Ahmedabad', propertyType: '3BHK' },
    contentHash: 'hash-tragad-verified',
  });

  await knowledgeRepository.createChunk({
    id: 'chk-shyam-tragad',
    documentId: docTragad.id,
    projectId: prycoons.id,
    content: `Project: Shyam Heights 1\nDeveloper: Shyam Developers\nLocation: Tragad, Ahmedabad\nConfiguration: 2 & 3 BHK\nPrice: ₹68 lakh Onwards\nArea: 1539 - 2007 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Landscaped Greenery, Children Play Area, EV Charging\nAddress: Tragad, Ghatlodiya Taluka, Ahmedabad, Gujarat, 382470, India\nSource: https://prycoons.com/property/shyam-heights-1-in-tragad-ahmedabad/`,
    metadata: {
      projectName: 'Shyam Heights 1',
      developer: 'Shyam Developers',
      location: 'Tragad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹68 lakh Onwards',
      priceNum: 68,
      carpetArea: '1539 - 2007 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/shyam-heights-1-in-tragad-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/shyam-heights-1-in-tragad-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2026/02/Shyam-Heights_3-584x438.webp',
      amenities: ['Landscaped Greenery', 'Children Play Area', 'EV Charging'],
    },
    chunkIndex: 0,
  });

  await knowledgeRepository.createChunk({
    id: 'chk-nilyam-tragad',
    documentId: docTragad.id,
    projectId: prycoons.id,
    content: `Project: The Nilyam\nDeveloper: Nilyam Infraspace\nLocation: Tragad, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹80 lakh Onwards\nArea: 1899 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Rooftop Garden, Gym, CCTV Security, 24/7 Water\nAddress: Tragad, Ghatlodiya Taluka, Ahmedabad, Gujarat, 382470, India\nSource: https://prycoons.com/property/the-nilyam-in-tragad-ahmedabad/`,
    metadata: {
      projectName: 'The Nilyam',
      developer: 'Nilyam Infraspace',
      location: 'Tragad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹80 lakh Onwards',
      priceNum: 80,
      carpetArea: '1899 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/the-nilyam-in-tragad-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/the-nilyam-in-tragad-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2026/01/The-Nilyam_4-584x438.webp',
      amenities: ['Rooftop Garden', 'Gym', 'CCTV Security', '24/7 Water'],
    },
    chunkIndex: 1,
  });

  await knowledgeRepository.createChunk({
    id: 'chk-ekayan-tragad',
    documentId: docTragad.id,
    projectId: prycoons.id,
    content: `Project: B R Ekayan\nDeveloper: B R Group\nLocation: Tragad, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹95 lakh Onwards\nArea: 2313 - 2565 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Swimming Pool, Landscaped Garden, Multipurpose Court, EV Charging\nAddress: Tragad, Ahmedabad, Gujarat, 382470, India\nSource: https://prycoons.com/property/b-r-ekayan-in-tragad-ahmedabad/`,
    metadata: {
      projectName: 'B R Ekayan',
      developer: 'B R Group',
      location: 'Tragad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹95 lakh Onwards',
      priceNum: 95,
      carpetArea: '2313 - 2565 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/b-r-ekayan-in-tragad-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/b-r-ekayan-in-tragad-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2026/02/B-R-Ekayan_1-584x438.webp',
      amenities: ['Swimming Pool', 'Landscaped Garden', 'Multipurpose Court', 'EV Charging'],
    },
    chunkIndex: 2,
  });

  await knowledgeRepository.createChunk({
    id: 'chk-sid-gardenia-tragad',
    documentId: docTragad.id,
    projectId: prycoons.id,
    content: `Project: Siddharth Gardenia\nDeveloper: Siddharth Buildcon\nLocation: Tragad, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹76 lakh Onwards\nArea: 1872 - 2097 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Gazebo, Jogging Track, Children Play Area, Indoor Games\nAddress: Tragad, Ahmedabad, Gujarat, 382470, India\nSource: https://prycoons.com/property/siddharth-gardenia-in-tragad-ahmedabad/`,
    metadata: {
      projectName: 'Siddharth Gardenia',
      developer: 'Siddharth Buildcon',
      location: 'Tragad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹76 lakh Onwards',
      priceNum: 76,
      carpetArea: '1872 - 2097 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/siddharth-gardenia-in-tragad-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/siddharth-gardenia-in-tragad-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2025/11/1_Sid_Gardenia-584x438.webp',
      amenities: ['Gazebo', 'Jogging Track', 'Children Play Area', 'Indoor Games'],
    },
    chunkIndex: 3,
  });

  // 5b. Seed Science City Knowledge Source & Chunks (Aahvan Greens, Samatva Amaryllis, Harmony Harikesh)
  const srcScienceCity = await knowledgeRepository.createSource({
    id: 'src-science-city-3bhk',
    projectId: prycoons.id,
    url: 'https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/',
    title: '3 BHK Flats in Science City Ahmedabad | Prycoons',
    type: 'URL',
    status: 'INDEXED',
    size: '195 KB',
    extractedSummary: 'Verified listings for luxury 3 BHK apartments in Science City including Aahvan Greens from ₹1.65 crore onwards, Samatva Amaryllis from ₹1.1 crore onwards, and Harmony Harikesh from ₹1.45 crore onwards.',
  });

  const docScienceCity = await knowledgeRepository.createDocument({
    id: 'doc-science-city-3bhk',
    sourceId: srcScienceCity.id,
    projectId: prycoons.id,
    title: '3 BHK Flats in Science City Ahmedabad',
    url: 'https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/',
    content: 'Aahvan Greens – 3 BHK Science City, Ahmedabad, 2448 - 3150 Sq Ft Super Built Up Area, Price: ₹1.65 crore Onwards, Status: Under Construction, Rera Approved.\nSamatva Amaryllis – 3 BHK Science City, Ahmedabad, 2150 - 2400 Sq Ft Super Built Up Area, Price: ₹1.1 crore Onwards, Status: Under Construction, Rera Approved.\nHarmony Harikesh – 3 BHK Science City, Ahmedabad, 2350 - 2900 Sq Ft, Price: ₹1.45 crore Onwards, Status: Under Construction.',
    metadata: { location: 'Science City', city: 'Ahmedabad', propertyType: '3BHK' },
    contentHash: 'hash-science-city-verified',
  });

  await knowledgeRepository.createChunk({
    id: 'chk-aahvan-science-city',
    documentId: docScienceCity.id,
    projectId: prycoons.id,
    content: `Project: Aahvan Greens\nDeveloper: Aahvan Group\nLocation: Science City, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹1.65 crore Onwards\nArea: 2448–3150 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Landscaped Garden, Gymnasium, Swimming Pool, Banquet Hall, Indoor Games, Children's Play Area\nAddress: Science City Road, Sola, Ahmedabad, Gujarat, 380060, India\nSource: https://prycoons.com/property/aahvan-greens-in-science-city-ahmedabad/`,
    metadata: {
      projectName: 'Aahvan Greens',
      developer: 'Aahvan Group',
      location: 'Science City',
      city: 'Ahmedabad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹1.65 crore Onwards',
      priceNum: 165,
      carpetArea: '2448–3150 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/aahvan-greens-in-science-city-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/aahvan-greens-in-science-city-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2025/09/Aahvan-Greens_5-584x438.webp',
      amenities: ['Landscaped Garden', 'Gymnasium', 'Swimming Pool', 'Banquet Hall', 'Indoor Games', "Children's Play Area"],
    },
    chunkIndex: 0,
  });

  await knowledgeRepository.createChunk({
    id: 'chk-samatva-science-city',
    documentId: docScienceCity.id,
    projectId: prycoons.id,
    content: `Project: Samatva Amaryllis\nDeveloper: Samatva Group\nLocation: Science City, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹1.1 crore Onwards\nArea: 2150 - 2400 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Landscaped Garden, Gymnasium, Clubhouse, EV Charging Station\nAddress: Science City, Sola, Ahmedabad, Gujarat, 380060, India\nSource: https://prycoons.com/property/samatva-amaryllis-in-science-city-ahmedabad/`,
    metadata: {
      projectName: 'Samatva Amaryllis',
      developer: 'Samatva Group',
      location: 'Science City',
      city: 'Ahmedabad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹1.1 crore Onwards',
      priceNum: 110,
      carpetArea: '2150 - 2400 Sq Ft',
      sourceUrl: 'https://prycoons.com/property/samatva-amaryllis-in-science-city-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/samatva-amaryllis-in-science-city-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2024/02/Samatva-Amaryllis-10_50-1240x768-1-584x438.webp',
      amenities: ['Landscaped Garden', 'Gymnasium', 'Clubhouse', 'EV Charging Station'],
    },
    chunkIndex: 1,
  });

  await knowledgeRepository.createChunk({
    id: 'chk-harmony-science-city',
    documentId: docScienceCity.id,
    projectId: prycoons.id,
    content: `Project: Harmony Harikesh\nDeveloper: Harmony Group\nLocation: Science City, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹1.45 crore Onwards\nArea: 2350 - 2900 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Infinity Pool, Sky Lounge, Squash Court, EV Charging\nAddress: Science City, Ahmedabad, Gujarat, 380060, India\nSource: https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/`,
    metadata: {
      projectName: 'Harmony Harikesh',
      developer: 'Harmony Group',
      location: 'Science City',
      city: 'Ahmedabad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹1.45 crore Onwards',
      priceNum: 145,
      carpetArea: '2350 - 2900 Sq Ft',
      sourceUrl: 'https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2024/02/Harmony-Harikesh_12-584x438.webp',
      amenities: ['Infinity Pool', 'Sky Lounge', 'Squash Court', 'EV Charging'],
    },
    chunkIndex: 2,
  });

  // 5c. Seed Chandkheda Knowledge Source & Chunks
  const srcChandkheda = await knowledgeRepository.createSource({
    id: 'src-chandkheda-listings',
    projectId: prycoons.id,
    url: 'https://prycoons.com/area/properties-in-chandkheda-ahmedabad/',
    title: 'Properties in Chandkheda Ahmedabad | Prycoons',
    type: 'URL',
    status: 'INDEXED',
    size: '180 KB',
    extractedSummary: 'Verified listings in Chandkheda including Sahajanand Marigold, Kautilya One 54, Nivasa, and Eden Parmeshwar.',
  });
  const docChandkheda = await knowledgeRepository.createDocument({
    id: 'doc-chandkheda-listings',
    sourceId: srcChandkheda.id,
    projectId: prycoons.id,
    title: 'Properties in Chandkheda Ahmedabad',
    url: 'https://prycoons.com/area/properties-in-chandkheda-ahmedabad/',
    content: 'Verified Chandkheda properties: Eden Parmeshwar (2 & 3 BHK, ₹60 lakh Onwards), Sahajanand Marigold (3 BHK, ₹85.5 lakh Onwards), Kautilya One 54 (3 BHK, ₹93 lakh Onwards), Nivasa (3 BHK, ₹83 lakh Onwards).',
    metadata: { location: 'Chandkheda', city: 'Ahmedabad' },
    contentHash: 'hash-chandkheda-verified',
  });
  await knowledgeRepository.createChunk({
    id: 'chk-marigold-chandkheda',
    documentId: docChandkheda.id,
    projectId: prycoons.id,
    content: `Project: Sahajanand Marigold\nDeveloper: Sahajanand Group\nLocation: Chandkheda, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹85.5 lakh Onwards\nArea: 1650 - 1850 Sq Ft\nStatus: Under Construction (RERA Approved)\nAmenities: Landscaped Garden, Gymnasium, 24/7 Security, Children Play Area\nAddress: Chandkheda, Ahmedabad, Gujarat, 382424\nSource: https://prycoons.com/property/sahajanand-marigold-in-chandkheda-ahmedabad/`,
    metadata: {
      projectName: 'Sahajanand Marigold',
      developer: 'Sahajanand Group',
      location: 'Chandkheda',
      city: 'Ahmedabad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹85.5 lakh Onwards',
      priceNum: 85.5,
      sourceUrl: 'https://prycoons.com/property/sahajanand-marigold-in-chandkheda-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/sahajanand-marigold-in-chandkheda-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2026/02/Sahajanand-Marigold_3-584x438.webp',
      amenities: ['Landscaped Garden', 'Gymnasium', '24/7 Security'],
    },
    chunkIndex: 0,
  });
  await knowledgeRepository.createChunk({
    id: 'chk-eden-chandkheda',
    documentId: docChandkheda.id,
    projectId: prycoons.id,
    content: `Project: Eden Parmeshwar\nDeveloper: Parmeshwar Group\nLocation: Chandkheda, Ahmedabad\nConfiguration: 2 & 3 BHK\nPrice: ₹60 lakh Onwards\nArea: 1350 - 1650 Sq Ft\nStatus: Under Construction (RERA Approved)\nAmenities: Clubhouse, Gym, EV Charging, Garden\nAddress: Chandkheda, Ahmedabad, Gujarat, 382424\nSource: https://prycoons.com/property/eden-parmeshwar-in-chandkheda-ahmedabad/`,
    metadata: {
      projectName: 'Eden Parmeshwar',
      developer: 'Parmeshwar Group',
      location: 'Chandkheda',
      city: 'Ahmedabad',
      propertyType: '3BHK',
      bhk: '2 & 3 BHK',
      price: '₹60 lakh Onwards',
      priceNum: 60,
      sourceUrl: 'https://prycoons.com/property/eden-parmeshwar-in-chandkheda-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/eden-parmeshwar-in-chandkheda-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2025/11/Eden-Parmeshwar_1-584x438.webp',
      amenities: ['Clubhouse', 'Gym', 'EV Charging', 'Garden'],
    },
    chunkIndex: 1,
  });

  // 5d. Seed Zundal Knowledge Source & Chunks
  const srcZundal = await knowledgeRepository.createSource({
    id: 'src-zundal-listings',
    projectId: prycoons.id,
    url: 'https://prycoons.com/area/properties-in-zundal-ahmedabad/',
    title: 'Properties in Zundal Ahmedabad | Prycoons',
    type: 'URL',
    status: 'INDEXED',
    size: '180 KB',
  });
  const docZundal = await knowledgeRepository.createDocument({
    id: 'doc-zundal-listings',
    sourceId: srcZundal.id,
    projectId: prycoons.id,
    title: 'Properties in Zundal Ahmedabad',
    url: 'https://prycoons.com/area/properties-in-zundal-ahmedabad/',
    content: 'Verified Zundal properties: Sepal Elegant 6 (₹60 lakh Onwards, 2 & 3 BHK), Vivaan Orbit (₹63 lakh Onwards, 2 & 3 BHK), OM Heights (₹70 lakh Onwards, 2 & 3 BHK).',
    metadata: { location: 'Zundal', city: 'Ahmedabad' },
    contentHash: 'hash-zundal-verified',
  });
  await knowledgeRepository.createChunk({
    id: 'chk-sepal-zundal',
    documentId: docZundal.id,
    projectId: prycoons.id,
    content: `Project: Sepal Elegant 6\nDeveloper: Sepal Group\nLocation: Zundal, Ahmedabad\nConfiguration: 2 & 3 BHK\nPrice: ₹60 lakh Onwards\nArea: 1350 - 1650 Sq Ft\nStatus: Under Construction (RERA Approved)\nAmenities: Landscaped Garden, Gymnasium, Security\nAddress: Zundal, Ahmedabad, Gujarat, 382421\nSource: https://prycoons.com/property/sepal-elegant-6-in-zundal-ahmedabad/`,
    metadata: {
      projectName: 'Sepal Elegant 6',
      developer: 'Sepal Group',
      location: 'Zundal',
      city: 'Ahmedabad',
      propertyType: '3BHK',
      bhk: '2 & 3 BHK',
      price: '₹60 lakh Onwards',
      priceNum: 60,
      sourceUrl: 'https://prycoons.com/property/sepal-elegant-6-in-zundal-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/sepal-elegant-6-in-zundal-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2026/05/Sepal-Elegant-6_1-584x438.webp',
      amenities: ['Landscaped Garden', 'Gymnasium', 'Security'],
    },
    chunkIndex: 0,
  });

  // 5e. Seed Shilaj Knowledge Source & Chunks
  const srcShilaj = await knowledgeRepository.createSource({
    id: 'src-shilaj-listings',
    projectId: prycoons.id,
    url: 'https://prycoons.com/area/properties-in-shilaj-ahmedabad/',
    title: 'Properties in Shilaj Ahmedabad | Prycoons',
    type: 'URL',
    status: 'INDEXED',
  });
  const docShilaj = await knowledgeRepository.createDocument({
    id: 'doc-shilaj-listings',
    sourceId: srcShilaj.id,
    projectId: prycoons.id,
    title: 'Properties in Shilaj Ahmedabad',
    url: 'https://prycoons.com/area/properties-in-shilaj-ahmedabad/',
    content: 'Verified Shilaj properties: Callisto Emerland (3 BHK, ₹93 lakh Onwards), Anantam (3 BHK, ₹1.04 crore Onwards), Sheldia Divine (2 BHK, ₹54 lakh Onwards), Param Nest (2 BHK, ₹55 lakh Onwards).',
    metadata: { location: 'Shilaj', city: 'Ahmedabad' },
    contentHash: 'hash-shilaj-verified',
  });
  await knowledgeRepository.createChunk({
    id: 'chk-callisto-shilaj',
    documentId: docShilaj.id,
    projectId: prycoons.id,
    content: `Project: Callisto Emerland\nDeveloper: Callisto Group\nLocation: Shilaj, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹93 lakh Onwards\nArea: 1850 - 2100 Sq Ft\nStatus: Under Construction (RERA Approved)\nAmenities: Landscaped Greenery, Gym, 24/7 Security\nAddress: Shilaj, Ahmedabad, Gujarat, 380059\nSource: https://prycoons.com/property/callisto-emerland-in-shilaj-ahmedabad/`,
    metadata: {
      projectName: 'Callisto Emerland',
      developer: 'Callisto Group',
      location: 'Shilaj',
      city: 'Ahmedabad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹93 lakh Onwards',
      priceNum: 93,
      sourceUrl: 'https://prycoons.com/property/callisto-emerland-in-shilaj-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/callisto-emerland-in-shilaj-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2025/11/Callisto-Emerland_3-584x438.webp',
      amenities: ['Landscaped Greenery', 'Gym', '24/7 Security'],
    },
    chunkIndex: 0,
  });
  await knowledgeRepository.createChunk({
    id: 'chk-sheldia-shilaj',
    documentId: docShilaj.id,
    projectId: prycoons.id,
    content: `Project: Sheldia Divine\nDeveloper: Sheldia Group\nLocation: Shilaj, Ahmedabad\nConfiguration: 2 BHK\nPrice: ₹54 lakh Onwards\nArea: 1250 - 1400 Sq Ft\nStatus: Under Construction (RERA Approved)\nAmenities: Garden, Gym, CCTV\nAddress: Shilaj, Ahmedabad, Gujarat, 380059\nSource: https://prycoons.com/property/sheldia-divine-in-shilaj-ahmedabad/`,
    metadata: {
      projectName: 'Sheldia Divine',
      developer: 'Sheldia Group',
      location: 'Shilaj',
      city: 'Ahmedabad',
      propertyType: '2BHK',
      bhk: '2 BHK',
      price: '₹54 lakh Onwards',
      priceNum: 54,
      sourceUrl: 'https://prycoons.com/property/sheldia-divine-in-shilaj-ahmedabad/',
      propertyDetailUrl: 'https://prycoons.com/property/sheldia-divine-in-shilaj-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2025/11/Sheldia-Divine_1-584x438.webp',
      amenities: ['Garden', 'Gym', 'CCTV'],
    },
    chunkIndex: 1,
  });

  // 6. Seed Sample Leads & Analytics Events
  logger.info('Seeding sample leads...');
  await leadRepository.createLead({
    projectId: prycoons.id,
    name: 'Vikram Patel',
    phone: '+91 98250 14890',
    email: 'vikram.p@apexcapital.in',
    intent: 'buying',
    preferences: { location: 'Science City / Sola', homeType: '3BHK', budget: '₹1.35 Cr - ₹1.85 Cr' },
    source: 'chatbot',
  });

  await analyticsRepository.recordEvent({
    projectId: prycoons.id,
    eventType: 'chat_started',
    metadata: { channel: 'web' },
  });

  logger.info('✅ Seeding completed successfully!');
}
