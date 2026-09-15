type PostDetailPageProps = {
    params: Promise< {id: string} >;
};

export default async function PostDetailPage({
    params,   
}: PostDetailPageProps) {
    const { id } = await params;

    return (
        <section className="space-y-4">
            <h1 className="text-3xl font-bold">Post Detail</h1>
            <p className="text-foreground/70">게시글 ID: {id}</p>
        </section>
    );
}