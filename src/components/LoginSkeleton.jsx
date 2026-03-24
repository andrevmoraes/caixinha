import Skeleton from './Skeleton';

export default function LoginSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gray-100 px-4 py-6">
      <div className="bg-white p-6 sm:p-8 w-full max-w-sm border-l-4 border-l-[var(--color-marinho-itau)]">
        {/* Cabeçalho */}
        <div className="mb-8">
          <Skeleton width="w-32" height="h-10" className="mb-3" />
          <Skeleton width="w-48" height="h-4" />
        </div>

        {/* Campo Nome */}
        <div className="mb-6">
          <Skeleton width="w-24" height="h-3" className="mb-2" />
          <Skeleton width="w-full" height="h-10" className="mb-2" />
          <Skeleton width="w-40" height="h-2" />
        </div>

        {/* Campo PIN */}
        <div className="mb-6">
          <Skeleton width="w-24" height="h-3" className="mb-2" />
          <Skeleton width="w-full" height="h-10" className="mb-2" />
          <Skeleton width="w-40" height="h-2" />
        </div>

        {/* Botão de entrar */}
        <Skeleton width="w-full" height="h-12" className="mb-4" />

        {/* Divisor */}
        <div className="relative my-6">
          <div className="h-px bg-gray-300"></div>
          <div className="absolute inset-0 flex justify-center">
            <span className="px-2 bg-white text-xs text-gray-500">ou</span>
          </div>
        </div>

        {/* Botão de cadastro */}
        <Skeleton width="w-full" height="h-10" />
      </div>
    </div>
  );
}
