export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-bold">利用規約</h1>

      <p className="mt-6">
        この利用規約（以下、「本規約」）は、FRNow（以下、「本サービス」）の利用条件を定めるものです。
        ユーザーは本規約に同意の上、本サービスを利用するものとします。
      </p>

      <h2 className="mt-10 text-2xl font-semibold">第1条（サービス内容）</h2>
      <p className="mt-4">
        本サービスは、暗号資産デリバティブ市場に関する情報（Funding Rate、Open Interestなど）を
        分析し、通知する情報提供サービスです。
      </p>

      <h2 className="mt-10 text-2xl font-semibold">第2条（免責事項）</h2>
      <p className="mt-4">
        本サービスは投資助言を目的としたものではありません。
        提供される情報の正確性・完全性・有用性を保証するものではありません。
      </p>

      <p className="mt-4">
        本サービスの情報を利用した取引により生じたいかなる損失についても、
        運営者は責任を負いません。
      </p>

      <h2 className="mt-10 text-2xl font-semibold">第3条（サービス変更）</h2>
      <p className="mt-4">
        本サービスは予告なく内容を変更、停止する場合があります。
      </p>

      <h2 className="mt-10 text-2xl font-semibold">第4条（禁止事項）</h2>
      <p className="mt-4">
        本サービスの不正利用、リバースエンジニアリング、システムへの過度な負荷を与える行為は禁止します。
      </p>

      <p className="mt-10 text-sm text-gray-500">
        最終更新日: 2026年
      </p>
    </main>
  );
}