function Loading({ text = 'Memuat data...' }) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>

                <p className="text-sm text-gray-500">
                    {text}
                </p>
            </div>
        </div>
    );
}

export default Loading;