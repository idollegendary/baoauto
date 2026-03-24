import Head from 'next/head'

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Head>
        <title>Технічні роботи</title>
        <meta name="description" content="Сайт тимчасово недоступний через технічні роботи" />
      </Head>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Технічні роботи</h1>
        <p className="text-lg text-gray-600 mb-8">
          Сайт тимчасово недоступний. Ми проводимо технічне обслуговування.
        </p>
        <p className="text-sm text-gray-500">
          Спробуйте зайти пізніше.
        </p>
      </div>
    </div>
  )
}