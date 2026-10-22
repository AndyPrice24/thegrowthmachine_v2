import { disciplineRoute } from '@/components/DisciplinePage';

const route = disciplineRoute('ecommerce');

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export const dynamicParams = false;
export default route.Discipline;
