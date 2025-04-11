import {
    Input,
    InputGroup,
    InputLeftElement,
    Icon,
} from "@chakra-ui/react"
import { FaSearch } from "react-icons/fa"

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

const SearchInput = ({ value, onChange, placeholder = "Search" }: SearchInputProps) => {
    return (
        <InputGroup w={{ base: "100%", md: "auto" }}>
            <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="ui.dim" />
            </InputLeftElement>
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                fontSize={{ base: "sm", md: "inherit" }}
                borderRadius="8px"
            />
        </InputGroup>
    )
}

export default SearchInput
