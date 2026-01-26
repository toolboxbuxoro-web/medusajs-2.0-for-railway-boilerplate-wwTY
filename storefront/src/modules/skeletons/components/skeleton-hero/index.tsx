const SkeletonHero = () => {
  return (
    <div className="w-full relative bg-ui-bg-subtle animate-pulse rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl sm:shadow-2xl shadow-black/10 mb-4 sm:mb-6 lg:mb-10 aspect-[6/1] overflow-hidden">
      <div className="absolute inset-0 bg-gray-100"></div>
    </div>
  )
}

export default SkeletonHero
