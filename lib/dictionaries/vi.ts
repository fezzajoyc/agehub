// vi — từ điển tiếng Việt. Hình dạng khóa phải khớp en chính xác (tests/seo.test.ts).
// Giữ nguyên "Zoyku", các placeholder {n}/{count}/{query}/{category} và token kỹ thuật.
const vi = {
  brand: "Zoyku",
  tagline: "Mọi công cụ đều chạy ngay trong trình duyệt của bạn.",
  metaDesc:
    "Hơn 120 công cụ trực tuyến miễn phí cho PDF, ảnh, văn bản, lập trình viên và nhiều hơn nữa. Tất cả chạy ngay trong trình duyệt — file của bạn không bao giờ rời khỏi thiết bị.",

  nav: {
    tools: "Tất cả công cụ",
    categories: "Danh mục",
    about: "Giới thiệu",
    menu: "Menu",
    language: "Ngôn ngữ",
  },

  home: {
    heroTitle: "Công cụ miễn phí, không bao giờ tải file của bạn lên",
    heroSub:
      "Hơn 120 công cụ cho PDF, ảnh, văn bản, code và tính toán hằng ngày. Tất cả chạy cục bộ ngay trong trình duyệt — nhanh, miễn phí, không đăng ký, không tải lên.",
    browseAll: "Xem tất cả công cụ",
    categoriesTitle: "Danh mục",
    featuredTitle: "Công cụ phổ biến",
    trustLocal: "File luôn ở lại thiết bị của bạn",
    trustFree: "Miễn phí, không cần tài khoản",
    trustFast: "Tức thì, dùng được cả khi offline",
    rotating: [
      "Gộp 20 file PDF thành một — không cần tải lên bất kỳ đâu",
      "Nén ảnh xuống còn một phần tư dung lượng, kể cả khi offline",
      "Hợp đồng, bản scan và ảnh chụp màn hình — xử lý ngay trong tab trình duyệt",
      "Không tài khoản, không watermark, không giới hạn kích thước file",
    ],
    statsLabels: { tools: "công cụ", languages: "ngôn ngữ", uploads: "lượt tải lên", accounts: "tài khoản" },
    eyebrow: "Miễn phí mãi mãi",
    heroCtaSecondary: "Cách hoạt động",
    statsTools: "{n} công cụ",
    statsLanguages: "{n} ngôn ngữ",
    statsUploads: "0 lượt tải lên",
    statsAccounts: "0 tài khoản",
    categoriesSub: "Bảy nhóm công cụ, tất cả chạy ngay trên thiết bị của bạn.",
    popularSub: "Những công cụ được mở nhiều nhất.",
    privacyTitle: "File của bạn không bao giờ rời khỏi thiết bị.",
    privacySub:
      "Không có bước tải lên. Các công cụ là JavaScript chạy trong trình duyệt của bạn — đó không phải lời hứa về chính sách, mà là cách chúng được xây dựng.",
    privacyPoint1T: "Xử lý cục bộ",
    privacyPoint1D:
      "File được đọc bằng File API của chính trình duyệt và xử lý trong bộ nhớ. Không có gì được truyền đi bất cứ đâu.",
    privacyPoint2T: "Không cần tài khoản",
    privacyPoint2D: "Không đăng ký, không email, không lưu lịch sử. Mở công cụ lên và dùng ngay.",
    privacyPoint3T: "Trung thực từ thiết kế",
    privacyPoint3D:
      "Nếu có gì đó thực sự không thể làm trong trình duyệt, chúng tôi nói thẳng thay vì giả vờ được.",
    privacyLink: "Đọc ghi chú riêng tư đầy đủ",
    endTitle: "Chọn một công cụ. Nó chỉ đơn giản là hoạt động.",
    endSub: "Năm ngôn ngữ, không một lượt tải lên, không cần cài đặt gì.",
  },

  tools: {
    title: "Tất cả công cụ",
    subtitle: "Tìm kiếm trong {count} công cụ trình duyệt miễn phí. Không tải lên, không đăng ký.",
    filterPlaceholder: "Tìm công cụ…",
    count: "{count} công cụ",
    empty: "Không có công cụ nào khớp với “{query}”.",
  },

  categories: {
    pdf: { name: "PDF", desc: "Gộp, tách, chuyển đổi và chỉnh sửa file PDF mà không cần tải lên bất cứ đâu." },
    image: { name: "Ảnh", desc: "Nén, đổi kích thước, cắt và chuyển đổi ảnh ngay trong trình duyệt của bạn." },
    text: { name: "Văn bản", desc: "Đếm, làm sạch, sắp xếp và biến đổi văn bản tức thì khi bạn gõ." },
    developer: { name: "Lập trình viên", desc: "Trình định dạng, bộ mã hóa, bộ giải mã và trình tạo cho công việc dev hằng ngày." },
    seo: { name: "SEO", desc: "Thẻ meta, dữ liệu có cấu trúc, xem trước SERP và các trợ thủ SEO trên trang." },
    security: { name: "Bảo mật", desc: "Mật khẩu, hàm băm và tra cứu — tạo và kiểm tra ngay trên thiết bị của bạn." },
    utility: { name: "Tiện ích", desc: "Bộ chuyển đổi đơn vị, máy tính và các trợ thủ hằng ngày." },
  },

  tool: {
    howTo: "Cách sử dụng",
    faq: "Câu hỏi thường gặp",
    related: "Công cụ liên quan",
    privacyNote:
      "Công cụ này chạy hoàn toàn trong trình duyệt của bạn. Dữ liệu không bao giờ rời khỏi thiết bị — không được tải lên bất kỳ máy chủ nào.",
    inCategory: "Xem thêm trong {category}",
    backToCategory: "Tất cả công cụ {category}",
  },

  common: {
    copy: "Sao chép",
    copied: "Đã sao chép",
    download: "Tải xuống",
    reset: "Đặt lại",
    swap: "Đảo chiều",
    clear: "Xóa",
    error: "Đã xảy ra lỗi. Kiểm tra dữ liệu nhập và thử lại.",
    input: "Đầu vào",
    output: "Kết quả",
    settings: "Tùy chọn",
    dropFiles: "Kéo thả file vào đây hoặc bấm để chọn",
    dropFile: "Kéo thả file vào đây hoặc bấm để chọn",
    processing: "Đang xử lý…",
    fileSize: "Dung lượng",
    sample: "Dùng thử ví dụ",
    uppercase: "CHỮ IN HOA",
  },

  unit: {
    from: "Từ",
    to: "Sang",
    amount: "Số lượng",
    result: "Kết quả",
    common: "Chuyển đổi thường dùng",
    formula: "Công thức",
    allUnits: "Tất cả đơn vị",
  },

  text: {
    stats: {
      words: "Từ",
      characters: "Ký tự",
      charsNoSpaces: "Không khoảng trắng",
      sentences: "Câu",
      paragraphs: "Đoạn",
      lines: "Dòng",
      readingTime: "Thời gian đọc",
      readingMinutes: "{n} phút đọc",
    },
  },

  footer: {
    line: "Công cụ trình duyệt miễn phí. Mọi thứ bạn làm ở đây đều ở lại thiết bị của bạn.",
    privacy: "Quyền riêng tư",
    terms: "Điều khoản",
    about: "Giới thiệu",
    badges: "Huy hiệu",
    language: "Ngôn ngữ",
  },

  badge: {
    title: "Huy hiệu Zoyku",
    desc: "Gắn huy hiệu Zoyku lên trang web, README hay tài liệu của bạn. Nó dẫn về đây và cho mọi người biết các công cụ phía sau chạy hoàn toàn trong trình duyệt.",
    voluntary: "Việc nhúng hoàn toàn tự nguyện — chọn một huy hiệu nếu bạn thích dự án này. Không cần xin phép ai.",
    md: "Markdown (README)",
    html: "HTML (trang web)",
    thanks: "Cảm ơn bạn đã lan tỏa — mỗi lượt nhúng giúp nhiều người hơn khám phá những công cụ tôn trọng file của họ.",
  },

  embed: {
    title: "Nhúng công cụ này",
    desc: "Đưa công cụ này vào trang của bạn bằng một dòng — nó chạy trong trình duyệt của khách.",
  },

    mcp: {
    title: "Máy chủ MCP — công cụ cho AI gọi trực tiếp",
    desc1: "Zoyku đi kèm máy chủ MCP (Model Context Protocol): các trợ lý AI như Claude hay Cursor có thể chạy chính các máy tính và bộ chuyển đổi trên site này — cùng logic đã kiểm thử, không viết lại.",
    desc2: "Các công cụ chạy hàm thuần của site (đổi đơn vị, tài chính, ước lượng sức khỏe, xử lý văn bản). Chạy qua npx trên máy của AI client — không gửi gì đến máy chủ của chúng tôi.",
    toolsTitle: "Công cụ chạy được ({n})",
    requiresNode: "Cần Node.js 18+. Máy chủ chạy cục bộ qua stdio; chỉ các lệnh bạn gọi được tính trên máy của bạn.",
    privacy: "Cần Node.js 18+. Máy chủ chạy cục bộ qua stdio; chỉ các lệnh bạn gọi được tính trên máy của bạn.",
  },

    notFound: {
    title: "Không tìm thấy trang",
    body: "Công cụ bạn tìm không tồn tại. Hãy xem tất cả công cụ thay thế.",
    home: "Về trang chủ",
  },
};

export default vi;
