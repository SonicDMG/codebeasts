import { BeastCard } from "@/app/components/gallery/BeastCard";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";
import { fetchUserImageRecord } from "@/lib/imageRecords";

// Applying 'any' workaround for props due to Next.js 15 build issue
export default async function DirectPage(props: any) {
  const username = props?.params?.username as string;

  if (!username) {
    return <div>Error: Username not found in parameters.</div>;
  }

  const image = await fetchUserImageRecord(username);
  
  return (
    <div className="w-full flex flex-col items-center pt-8">
      <div className="w-full max-w-4xl">
        <Card className="p-6 space-y-4 bg-black/30 border-white/10 rounded-xl">
          {image ? (
            <>
              <h1 className="text-2xl font-bold text-center break-words mb-4">
                CodeBeast for @{username}
              </h1>
              <BeastCard
                beast={{
                  username: image.username,
                  image_url: image.image_url,
                }}
                showActions
              />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center break-words">
                No CodeBeast found for @{username}
              </h1>
              <div className="text-center text-muted-foreground">
                This GitHub user hasn't generated their CodeBeast yet.
              </div>
            </>
          )}
          <div className="text-center">
            <Link 
              href="/"
              className="text-primary hover:underline"
            >
              {image ? "Generate your own CodeBeast" : "Generate a CodeBeast"}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
} 