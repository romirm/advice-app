import InputBox from "../components/InputBox"

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">Welcome to Aptly!</h1>
      <InputBox />
    </div>
  )
}

export default Home