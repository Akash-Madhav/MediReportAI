import PrescriptionDetailContent from './PrescriptionDetailContent';

// This is now an async Server Component
export default async function PrescriptionDetailPage({
  params,
}: {
  params: {id: string};
}) {
  // Direct access to 'params.id' is now safe in a Server Component.
  const {id} = params;

  // Pass the 'id' to the Client Component as a prop.
  return <PrescriptionDetailContent id={id} />;
}
