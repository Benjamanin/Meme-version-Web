import { Stack, Paper, Text, Image, Modal, Button, TextInput, FileInput, Group, Divider, Select } from '@mantine/core';
import { useEffect, useState } from 'react';
import { obtenerMemes, subirMeme, likeMeme } from '../Servicios/Api';
import { IconPlus } from '@tabler/icons-react';
import React, { useContext } from 'react';
import { ContextoAutenticacion } from './ContextoAutenticacion';

export default function Body() {
    const [memes, setMemes] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [imagen, setImagen] = useState(null);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Meme más reciente');
    const [error, setError] = useState(null);
    const { credenciales, estaAutenticado } = useContext(ContextoAutenticacion);


    const obtenerYActualizarMemes = async () => {
        let pagina = 1;
        const cantidad = 40;
        let todosLosMemes = [];
        let hayMas = true;
    
        while (hayMas) {
            const [data, error] = await obtenerMemes(pagina, cantidad);
            if (data) {
                todosLosMemes = [...todosLosMemes, ...data];
                hayMas = data.length === cantidad; 
                pagina++;
            } else {
                hayMas = false; 
                setError("Error al cargar los memes.");
            }
        }
        setMemes(todosLosMemes);
    };

    const filtrarMemesPorCategoria = (data, categoria) => {
        if (categoria === "Meme más reciente") {
            return [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (categoria === "Meme más gustado") {
            return [...data].sort((a, b) => b.likes - a.likes);
        }
        return data;
    };

    useEffect(() => {
        obtenerYActualizarMemes();
    }, []);

    useEffect(() => {
        const actualizarMemesPorCategoria = async () => {
            const [data, error] = await obtenerMemes(1, 40);
            if (data) {
                const memesFiltrados = filtrarMemesPorCategoria(data, categoriaSeleccionada);
                setMemes(memesFiltrados);
            } else {
                setError("Error al actualizar los memes por categoría.");
            }
        };
        actualizarMemesPorCategoria();
    }, [categoriaSeleccionada]);

    const handleSubirMeme = async () => {
        if (!titulo || !descripcion || !imagen) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const token = credenciales.token;

        const [resultado, error] = await subirMeme(token, titulo, descripcion, imagen);

        if (error) {
            alert(error);
        } else {
            setMemes((prevMemes) => [resultado, ...prevMemes]);
            setModalOpen(false);
            alert("Meme subido exitosamente.");

            setTitulo('');
            setDescripcion('');
            setImagen(null);

            obtenerYActualizarMemes();
        }
    };

    const handleFileChange = (file) => {
        if (file) {
            if (file.type.startsWith('image/')) {
                setImagen(file);
            } else {
                alert("Por favor selecciona una imagen válida.");
            }
        } else {
            alert("No se ha seleccionado ninguna imagen.");
        }
    };

    const handleLikeMeme = async (memeId, currentLikes) => {
        const token = credenciales.token;
        const [likes, error] = await likeMeme(token, memeId, currentLikes);

        if (error) {
          alert(error);
        } else {
          setMemes((prevMemes) =>
            prevMemes.map((meme) =>
              meme._id === memeId ? { ...meme, likes } : meme
            )
          );
        }
      };
      
    return (
        <>
            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title='Subir meme'
            >
                <TextInput label='Título' placeholder='Título del meme' value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                <TextInput label='Descripción' placeholder='Descripción del meme' value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                <FileInput label="Imagen" placeholder="Selecciona una imagen" onChange={handleFileChange} accept="image/*" />
                <Divider my="xs" label="Ya po sube el meme, no seas fome" labelPosition="center" />
                <Button className='SubirMeme' color='green' onClick={handleSubirMeme}>Subir meme</Button>
            </Modal>

            <Paper className='papermemes' padding="xl" shadow='lg' style={{ padding: 10 }}>
                <div className='divSelect'>
                    
                        <Select className='selectpro' label="Elige una de las siguientes categorias"
                            placeholder="Ej : Meme más gustado" data={['Meme más gustado', 'Meme más reciente']}
                            value={categoriaSeleccionada} onChange={setCategoriaSeleccionada} />
                    
                </div>
                <Divider my="xs" label="Memes" labelPosition="center" style={{ marginBottom: 70 }} />

                <Stack align='center'>
                    {memes.map((meme) => (
                        <Paper className='paperimagen' shadow='xl' key={meme._id} >
                            <Text c='green' align='center' size='xl' td="underline" fw='700'>{meme.title}</Text>
                            <Text fw='500' ta={'center'} c={'dimmed'}>{meme.description}</Text>
                            <Image className='imagenes' src={meme.img_url} alt={meme.title} />
                            <Group>
                                <Button className='botonMegusta' variant='light' color='teal' c='green' onClick={() => handleLikeMeme(meme._id, meme.likes)}>
                                    {meme.likes} Me gusta
                                </Button>
                                <Text className='postby' c='dimmed'>Posteado por: {meme.user}</Text>
                            </Group>
                        </Paper>
                    ))}
                </Stack>
            </Paper>

            {estaAutenticado && (
                <Button
                    onClick={() => setModalOpen(true)}
                    className='botonSubir'
                    color="lime"
                ><IconPlus size={30} /></Button>
            )}
        </>
    );
}
