// ksap-allow: documentation examples use source terminology, not product strings.
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../components/ui/resizable";

export default function ResizableStory() {
  return <div className="ksap-story">
    <div className="h-64 max-w-2xl overflow-hidden rounded-lg border bg-card">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={20}>
          <div className="flex h-full items-center justify-center bg-muted text-body">List</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={30}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65}>
              <div className="flex h-full items-center justify-center text-body">Detail</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35}>
              <div className="flex h-full items-center justify-center bg-muted text-body">Notes</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  </div>;
}
