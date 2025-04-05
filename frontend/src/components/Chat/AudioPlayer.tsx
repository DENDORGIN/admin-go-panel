import {
    IconButton,
    Flex,
    Box,
    Text,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { FiPlay, FiPause, FiVolume2, FiVolumeX } from "react-icons/fi";

const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const AudioPlayer = ({ src }: { src: string }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        const newMute = !isMuted;
        audioRef.current.muted = newMute;
        setIsMuted(newMute);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => setProgress(audio.currentTime);
        const setAudioData = () => setDuration(audio.duration);
        const onEnd = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("loadedmetadata", setAudioData);
        audio.addEventListener("ended", onEnd);

        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("loadedmetadata", setAudioData);
            audio.removeEventListener("ended", onEnd);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    return (
        <Box>
            <audio ref={audioRef} src={src} />
            <Flex align="center" gap={3} flexWrap="wrap">
                {/* ▶️ Кнопка відтворення */}
                <IconButton
                    aria-label={isPlaying ? "Pause" : "Play"}
                    icon={isPlaying ? <FiPause /> : <FiPlay />}
                    onClick={togglePlay}
                    size="sm"
                    colorScheme="teal"
                    borderRadius="full"
                />

                {/* 📉 Прогрес */}
                <Slider
                    value={progress}
                    min={0}
                    max={duration || 1}
                    onChange={(val) => {
                        if (audioRef.current) {
                            audioRef.current.currentTime = val;
                            setProgress(val);
                        }
                    }}
                    flex={1}
                    colorScheme="teal"
                >
                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>

                <Text fontSize="xs" color="gray.300" w="40px" textAlign="right">
                    {formatTime(progress)}
                </Text>

                {/* 🔊 Гучність */}
                <Flex align="center" gap={2} w="100px">
                    <IconButton
                        aria-label="Mute"
                        icon={isMuted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
                        onClick={toggleMute}
                        size="sm"
                        variant="ghost"
                        color="gray.300"
                    />
                    <Slider
                        value={isMuted ? 0 : volume}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(val) => {
                            setVolume(val);
                            if (audioRef.current) {
                                audioRef.current.muted = val === 0;
                                setIsMuted(val === 0);
                            }
                        }}
                        colorScheme="teal"
                        w="80px"
                    >
                        <SliderTrack>
                            <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                    </Slider>
                </Flex>
            </Flex>
        </Box>
    );
};

export default AudioPlayer;
