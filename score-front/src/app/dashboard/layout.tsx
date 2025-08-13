import Content from "./__components/layout/Content";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-full h-full">
      <Content>{children}</Content>
    </div>
  );
}

