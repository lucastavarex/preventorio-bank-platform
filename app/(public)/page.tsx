import { PublicAuthControls } from '@/components/public-auth-controls'

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicAuthControls />
      <main className="flex flex-1 items-center justify-center p-6">
        <h1 className="text-2xl font-bold">Home</h1>
      </main>
    </div>
  )
}
