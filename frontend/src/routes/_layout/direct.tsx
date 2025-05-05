import {createFileRoute} from "@tanstack/react-router";



export const Route = createFileRoute("/_layout/direct")({
    component: PlaceholderDirectPage,

});


function PlaceholderDirectPage() {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Тут буде direct-чат...</p>
        </div>
    );
}