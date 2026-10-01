// ksap-allow: documentation examples use source terminology, not product strings.
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../components/ui/breadcrumb";

export default function BreadcrumbStory() {
  return <div className="ksap-story">
    <Breadcrumb><BreadcrumbList>
      <BreadcrumbItem><BreadcrumbLink href="#">Workspace</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbLink href="#">Shipments</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbPage>SH-10442</BreadcrumbPage></BreadcrumbItem>
    </BreadcrumbList></Breadcrumb>
    <Breadcrumb><BreadcrumbList>
      <BreadcrumbItem><BreadcrumbLink href="#">Workspace</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem><BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbPage>Rates</BreadcrumbPage></BreadcrumbItem>
    </BreadcrumbList></Breadcrumb>
  </div>;
}
