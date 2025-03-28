import { Box, Image, Text, Link } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { PreviewService } from "../../client"
import { PreviewDto } from "../../client";


const LinkPreview = ({ url }: { url: string }) => {
    const preview = useLinkPreview(url);
    if (!preview) return null;
    console.log("LinkPreview received URL:", url);


    return (
        <Link href={preview.url} isExternal _hover={{ textDecoration: "none" }}>
            <Box borderWidth={1} borderRadius="md" overflow="hidden" mt={3}>
                {preview.image && <Image src={preview.image} maxH="150px" w="100%" objectFit="cover" />}
                <Box p={2}>
                    <Text fontWeight="bold" noOfLines={1}>{preview.title}</Text>
                    <Text fontSize="sm" color="gray.500" noOfLines={2}>
                        {preview.description}
                    </Text>
                </Box>
            </Box>
        </Link>
    );
};

export default LinkPreview;


const useLinkPreview = (url: string | null) => {
    const [preview, setPreview] = useState<PreviewDto | null>(null);

    useEffect(() => {
        if (!url) return;
        PreviewService.getPreview(url)
            .then(setPreview)
            .catch((err) => console.error("Error loading preview:", err));
    }, [url]);

    return preview;
};