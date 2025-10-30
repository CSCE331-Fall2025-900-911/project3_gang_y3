import Head from 'next/head';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>My Next.js App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          Hello, world!
        </h1>
        <p className="description">
          Welcome to your new Next.js project.
        </p>
      </main>
    </div>
  );
}