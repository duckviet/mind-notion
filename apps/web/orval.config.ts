module.exports = {
  api: {
    // Input: Nơi để lấy file spec
    input: {
      // Dùng file local
      target: "../backend/openapi/dist.yaml",
      // Hoặc dùng URL
      // target: 'http://localhost:8080/openapi.json',
    },
    // Output: Nơi sẽ đặt code được sinh ra
    output: {
      target: "./shared/services/generated/api.ts", // Tạo ra một file duy nhất
      client: "react-query", // Chỉ định chúng ta muốn dùng TanStack/React Query
      mode: "single", // Chế độ file đơn
      prettier: true, // Tự động format code bằng Prettier
      override: {
        mutator: {
          path: "./shared/services/axios/custom-instance.ts", // Dùng custom instance cho Orval
          name: "customInstance",
        },
      },
    },
    // (Tùy chọn) Bật tính năng hooks
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
};
