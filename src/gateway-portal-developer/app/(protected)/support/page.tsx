import { SectionHeader } from "@/components/common/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Support" description="We respond within 1 business day." />
      <Card>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Issue with transfer endpoint" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea id="details" placeholder="Include trace ID and steps to reproduce." />
            </div>
            <Button type="submit">Submit ticket</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
