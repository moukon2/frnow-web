export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-bold">プライバシーポリシー</h1>

      <p className="mt-6">
        FRNow（以下、「本サービス」）は、ユーザーのプライバシーを尊重し、
        個人情報の適切な管理に努めます。
      </p>

      <h2 className="mt-10 text-2xl font-semibold">取得する情報</h2>

      <ul className="mt-4 list-disc pl-6">
        <li>メールアドレス</li>
        <li>IPアドレス</li>
        <li>アクセスログ</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">利用目的</h2>

      <ul className="mt-4 list-disc pl-6">
        <li>サービス提供</li>
        <li>不正利用防止</li>
        <li>サービス改善</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">第三者提供</h2>
      <p className="mt-4">
        法令に基づく場合を除き、ユーザーの情報を第三者へ提供することはありません。
      </p>

      <p className="mt-10 text-sm text-gray-500">
        最終更新日: 2026年
      </p>
    </main>
  );
}