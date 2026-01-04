import repeat from "@lib/util/repeat"

const SkeletonCategories = () => {
  return (
    <div className="bg-white py-10 sm:py-16 border-b border-gray-100">
      <div className="content-container">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {repeat(6).map((index) => (
            <div
              key={index}
              className="flex flex-col items-center p-6 sm:p-8 bg-gray-50 rounded-3xl animate-pulse"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full mb-5"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SkeletonCategories
